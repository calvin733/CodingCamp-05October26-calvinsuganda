const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.beforeEach(async ({ page }) => {
    page.applicationErrors = [];
    page.on('pageerror', error => page.applicationErrors.push(error.message));
    await page.goto('/');
});

test.afterEach(async ({ page }) => {
    expect(page.applicationErrors).toEqual([]);
});

async function addTask(page, text) {
    await page.getByLabel('New task', { exact: true }).fill(text);
    await page.locator('#todo-add').click();
}
async function addLink(page, name, url) {
    await page.getByLabel('Website name', { exact: true }).fill(name);
    await page.getByLabel('Website URL', { exact: true }).fill(url);
    await page.locator('#link-add').click();
}

test('task lifecycle, inline cancellation and persistence across a real reload', async ({ page }) => {
    await addTask(page, 'First task');
    await expect(page.getByLabel('New task', { exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Edit First task', exact: true }).click();
    await page.getByRole('textbox', { name: 'Edit task', exact: true }).fill('Cancelled');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('.todo-text')).toHaveText('First task');
    await page.getByRole('button', { name: 'Edit First task', exact: true }).click();
    await page.getByRole('textbox', { name: 'Edit task', exact: true }).fill('Saved task');
    await page.getByRole('textbox', { name: 'Edit task', exact: true }).press('Enter');
    await page.getByRole('checkbox', { name: 'Mark Saved task complete', exact: true }).check();
    await addLink(page, 'Example', 'example.com');
    await page.reload();
    await expect(page.locator('.todo-text')).toHaveText('Saved task');
    await expect(page.locator('.todo-text')).toHaveClass(/completed/);
    await expect(page.locator('.todo-checkbox')).toBeChecked();
    await expect(page.locator('.link-button')).toHaveText('Example');
    const collections = await page.evaluate(() => ({ tasks: App.TodoManager.getTasks(), links: App.QuickLinksManager.getLinks() }));
    expect(collections.tasks[0].text).toBe('Saved task');
    expect(collections.links[0].url).toBe('https://example.com/');
    await page.getByRole('button', { name: 'Delete Saved task', exact: true }).click();
    await page.getByRole('button', { name: 'Delete Example', exact: true }).click();
    await page.reload();
    await expect(page.locator('.todo-item')).toHaveCount(0);
    await expect(page.locator('.link-item')).toHaveCount(0);
});

test('keyboard creation, whitespace validation, empty edit and Escape', async ({ page }) => {
    await page.getByLabel('New task', { exact: true }).fill('   ');
    await page.getByLabel('New task', { exact: true }).press('Enter');
    await expect(page.locator('.todo-item')).toHaveCount(0);
    await page.getByLabel('New task', { exact: true }).fill('Keyboard task');
    await page.getByLabel('New task', { exact: true }).press('Enter');
    await page.locator('.todo-edit').click();
    await page.getByRole('textbox', { name: 'Edit task', exact: true }).fill('   ');
    await page.getByRole('textbox', { name: 'Edit task', exact: true }).press('Enter');
    expect(await page.evaluate(() => App.TodoManager.getTasks()[0].text)).toBe('Keyboard task');
    await page.getByRole('textbox', { name: 'Edit task', exact: true }).press('Escape');
    await expect(page.locator('.todo-text')).toHaveText('Keyboard task');
    await page.getByLabel('Website name', { exact: true }).fill('Keyboard link');
    await page.getByLabel('Website URL', { exact: true }).fill('example.com');
    await page.getByLabel('Website URL', { exact: true }).press('Enter');
    await expect(page.locator('.link-button')).toHaveText('Keyboard link');
});

test('link opening passes noopener/noreferrer and rejects unsafe URLs', async ({ page }) => {
    await page.evaluate(() => { window.open = (...args) => { window.openArguments = args; return null; }; });
    await addLink(page, 'Example', 'example.com');
    // Center the new control before a real click; headless Firefox can drop
    // pointer events near the viewport edge after the page grows.
    await page.locator('.link-button').evaluate(el => el.scrollIntoView({ block: 'center' }));
    await page.locator('.link-button').click();
    expect(await page.evaluate(() => window.openArguments)).toEqual(['https://example.com/', '_blank', 'noopener,noreferrer']);
    await addLink(page, 'Unsafe', 'javascript:alert(1)');
    await expect(page.locator('.link-item')).toHaveCount(1);
    expect(await page.locator('#link-url').evaluate(el => el.validationMessage)).toBe('Please enter a valid URL');
    await page.locator('#link-url').fill('https://example.org');
    expect(await page.locator('#link-url').evaluate(el => el.validationMessage)).toBe('');
    await page.locator('#link-add').click();
    await expect(page.locator('.link-item')).toHaveCount(2);
});

test('a link opens an actual new tab with no opener', async ({ page, context }) => {
    await context.route('https://example.com/**', route => route.fulfill({
        status: 200, contentType: 'text/html', body: '<title>Saved website</title><h1>Saved website</h1>'
    }));
    await addLink(page, 'Example', 'example.com');
    await page.locator('.link-button').evaluate(el => el.scrollIntoView({ block: 'center' }));
    const [tab] = await Promise.all([
        context.waitForEvent('page'), page.locator('.link-button').click()
    ]);
    await tab.waitForLoadState();
    expect(tab.url()).toBe('https://example.com/');
    expect(await tab.evaluate(() => window.opener)).toBeNull();
    await expect(tab.getByRole('heading', { name: 'Saved website' })).toBeVisible();
    await tab.close();
});

test('text remains inert and corrupt stored collections recover', async ({ page }) => {
    const payload = '<img src=x onerror=alert(1)>';
    await addTask(page, payload); await addLink(page, payload, 'example.com');
    await expect(page.locator('#todo-list img, #links-list img')).toHaveCount(0);
    await expect(page.locator('.todo-text')).toHaveText(payload);
    await page.evaluate(() => {
        localStorage.setItem('dashboard_tasks', '{bad');
        localStorage.setItem('dashboard_links', JSON.stringify([null, { id: 'bad', name: 'Bad', url: 'javascript:alert(1)', createdAt: 1 }]));
    });
    await page.reload();
    await expect(page.locator('.todo-item')).toHaveCount(0); await expect(page.locator('.link-item')).toHaveCount(0);
    await addTask(page, 'Recovered'); await addLink(page, 'Recovered', 'example.com');
    await expect(page.locator('.todo-item')).toHaveCount(1); await expect(page.locator('.link-item')).toHaveCount(1);
});

for (const name of ['QuotaExceededError', 'SecurityError']) {
    test(`${name}: controls remain usable and expose storage warnings`, async ({ page }) => {
        await page.addInitScript(errorName => {
            const prototype = Storage.prototype;
            prototype.setItem = function() { throw new DOMException('Blocked', errorName); };
            if (errorName === 'SecurityError') prototype.getItem = function() { throw new DOMException('Blocked', errorName); };
        }, name);
        await page.reload(); await addTask(page, 'Memory task'); await addLink(page, 'Memory link', 'example.com');
        await expect(page.locator('.todo-text')).toHaveText('Memory task'); await expect(page.locator('.link-button')).toHaveText('Memory link');
        await expect(page.locator('#storage-status')).toBeVisible();
        await expect(page.locator('#storage-status')).toContainText(name === 'QuotaExceededError' ? 'Storage full' : 'Data will not persist');
    });
}

test('timer controls update exactly once per second and pause/resume/reset', async ({ page }) => {
    await page.clock.install();
    await page.locator('#timer-start').click();
    await expect(page.locator('#timer-display')).toHaveClass(/running/);
    await page.clock.runFor(1000); await expect(page.locator('#timer-display')).toHaveText('24:59');
    await page.locator('#timer-stop').click(); await page.clock.runFor(3000);
    await expect(page.locator('#timer-display')).toHaveText('24:59');
    await expect(page.locator('#timer-display')).not.toHaveClass(/running/);
    await page.locator('#timer-start').click(); await page.clock.runFor(1000);
    await expect(page.locator('#timer-display')).toHaveText('24:58');
    await page.locator('#timer-reset').click(); await page.clock.runFor(1000);
    await expect(page.locator('#timer-display')).toHaveText('25:00');
});

for (const permission of ['unsupported', 'denied', 'granted']) {
    test(`timer completion notification when ${permission}`, async ({ page }) => {
        await page.clock.install();
        await page.evaluate(state => {
            window.notifications = [];
            if (state === 'unsupported') delete window.Notification;
            else {
                window.Notification = function(title, options) { window.notifications.push({ title, options }); };
                window.Notification.permission = state;
            }
        }, permission);
        await page.locator('#timer-start').click(); await page.clock.runFor(1500 * 1000);
        await expect(page.locator('#timer-display')).toHaveText('00:00');
        await expect(page.locator('#timer-display')).not.toHaveClass(/running/);
        if (permission === 'granted') {
            const notices = await page.evaluate(() => window.notifications);
            expect(notices).toHaveLength(1); expect(notices[0].title).toBe('Focus Session Complete!');
        } else await expect(page.locator('#timer-notification-fallback')).toBeVisible();
        await page.locator('#timer-start').click(); await page.clock.runFor(1000);
        expect(await page.evaluate(() => window.notifications.length)).toBe(permission === 'granted' ? 1 : 0);
        await page.locator('#timer-reset').click(); await expect(page.locator('#timer-notification-fallback')).toBeHidden();
    });
}

test('startup, interactions and storage/display updates meet performance budgets', async ({ page }, testInfo) => {
    const metrics = await page.evaluate(async () => {
        const loadMs = performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd;
        const interactions = [], storageDisplay = [];
        // Seed a representative list to exercise updates alongside 50 existing items.
        for (let i = 0; i < 50; i++) App.TodoManager.addTask('Existing task ' + i);
        for (let i = 0; i < 10; i++) {
            const input = document.getElementById('todo-input'); input.value = 'Measured ' + i;
            let start = performance.now(); document.getElementById('todo-add').click();
            const elapsed = performance.now() - start;
            if (App.TodoManager.getTasks().length !== 51 + i) throw new Error('Creation did not execute');
            if (document.querySelectorAll('.todo-item').length !== 51 + i) throw new Error('Display did not update');
            if (JSON.parse(localStorage.getItem('dashboard_tasks')).length !== 51 + i) throw new Error('Storage did not update');
            interactions.push(elapsed); storageDisplay.push(elapsed);
        }
        let start = performance.now(); App.TodoManager.deleteTask(App.TodoManager.getTasks()[0].id);
        storageDisplay.push(performance.now() - start);
        start = performance.now(); document.querySelector('.todo-checkbox').click();
        interactions.push(performance.now() - start);
        start = performance.now(); document.querySelector('.todo-edit').click();
        interactions.push(performance.now() - start);
        document.querySelector('.todo-text-input').value = 'Measured edit';
        start = performance.now(); document.querySelector('.todo-save').click();
        interactions.push(performance.now() - start);
        document.getElementById('link-name').value = 'Measured link';
        document.getElementById('link-url').value = 'example.com';
        start = performance.now(); document.getElementById('link-add').click();
        let elapsed = performance.now() - start;
        interactions.push(elapsed); storageDisplay.push(elapsed);
        if (document.querySelectorAll('.link-item').length !== 1) throw new Error('Link display did not update');
        start = performance.now(); document.querySelector('.link-delete').click();
        elapsed = performance.now() - start;
        interactions.push(elapsed); storageDisplay.push(elapsed);
        if (document.querySelectorAll('.link-item').length !== 0) throw new Error('Link deletion did not update');
        start = performance.now(); document.getElementById('timer-start').click();
        interactions.push(performance.now() - start);
        document.getElementById('timer-reset').click();
        const heartbeatMs = await new Promise(resolve => {
            const before = performance.now(); setTimeout(() => resolve(performance.now() - before), 0);
        });
        return { loadMs, interactionMaxMs: Math.max(...interactions), storageDisplayMaxMs: Math.max(...storageDisplay), heartbeatMs };
    });
    console.log('Performance', testInfo.project.name, JSON.stringify(metrics));
    await testInfo.attach('performance.json', { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' });
    expect(metrics.loadMs).toBeGreaterThan(0); expect(metrics.loadMs).toBeLessThan(1000);
    expect(metrics.interactionMaxMs).toBeLessThan(50); expect(metrics.storageDisplayMaxMs).toBeLessThan(100);
    expect(metrics.heartbeatMs).toBeLessThan(50);
});

for (const width of [1280, 375]) {
    test(`layout, contrast, focus and touch targets at ${width}px`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 1000 });
        await addTask(page, 'Long task '.repeat(25)); await addLink(page, 'A long website name to test responsive wrapping', 'example.com');
        await page.locator('.todo-checkbox').check();
        const completed = await page.locator('.todo-text').evaluate(el => {
            const style = getComputedStyle(el);
            const opacity = Number(style.opacity);
            const rgb = style.color.match(/[0-9.]+/g).slice(0, 3).map(Number);
            // Completed text is on the white task section; account for reduced opacity.
            const linear = rgb.map(value => {
                const c = (value * opacity + 255 * (1 - opacity)) / 255;
                return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
            });
            const luminance = .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
            return { ratio: 1.05 / (luminance + .05), opacity, decoration: style.textDecorationLine };
        });
        expect(completed.ratio).toBeGreaterThanOrEqual(4.5);
        expect(completed.opacity).toBeLessThan(1);
        expect(completed.decoration).toContain('line-through');
        await page.locator('.todo-edit').click();
        const measurements = await page.evaluate(() => {
            function luminance(rgb) {
                const values = rgb.match(/[0-9.]+/g).slice(0, 3).map(v => {
                    const c = Number(v) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
                });
                return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
            }
            function background(el) {
                while (el) { const color = getComputedStyle(el).backgroundColor;
                    if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') return color; el = el.parentElement; }
                return 'rgb(255, 255, 255)';
            }
            const targets = Array.from(document.querySelectorAll('button, input[type=text], .todo-check-target'));
            const contrast = Array.from(document.querySelectorAll('button, input[type=text], h1, h2, #current-time, #current-date'))
                .map(el => { const a = luminance(getComputedStyle(el).color), b = luminance(background(el));
                    return { element: el.className || el.id || el.tagName, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) }; });
            return {
                overflow: document.documentElement.scrollWidth > window.innerWidth,
                maxWidth: getComputedStyle(document.querySelector('.container')).maxWidth,
                tooSmall: targets.filter(el => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map(el => el.className || el.id),
                lowContrast: contrast.filter(c => c.ratio < 4.5),
                focus: getComputedStyle(document.activeElement).outlineWidth,
                hoverTransition: getComputedStyle(document.querySelector('#todo-add')).transitionDuration
            };
        });
        expect(measurements.overflow).toBe(false); expect(measurements.maxWidth).toBe('800px');
        expect(measurements.tooSmall).toEqual([]); expect(measurements.lowContrast).toEqual([]);
        expect(measurements.focus).not.toBe('0px'); expect(measurements.hoverTransition).toBe('0.05s');
        await page.locator('#todo-add').hover();
        await expect.poll(() => page.locator('#todo-add').evaluate(el => getComputedStyle(el).backgroundColor))
            .toBe('rgb(30, 82, 139)');
        const screenshot = await page.screenshot({ fullPage: true });
        await testInfo.attach('layout.png', { body: screenshot, contentType: 'image/png' });
        fs.writeFileSync(path.join('/tmp', `dashboard-layout-${width}.png`), screenshot);
    });
}

test('application assets satisfy the single-file and zero-library constraints', async ({ page }) => {
    const assets = await page.evaluate(() => ({
        scripts: Array.from(document.scripts, s => s.getAttribute('src')),
        styles: Array.from(document.querySelectorAll('link[rel=stylesheet]'), s => s.getAttribute('href'))
    }));
    expect(assets.scripts).toEqual(['js/app.js']); expect(assets.styles).toEqual(['css/style.css']);
    expect(fs.readdirSync(path.join(__dirname, '../../js')).filter(n => n.endsWith('.js'))).toEqual(['app.js']);
    expect(fs.readdirSync(path.join(__dirname, '../../css')).filter(n => n.endsWith('.css'))).toEqual(['style.css']);
    await expect(page.locator('#current-time')).toHaveText(/^[0-2][0-9]:[0-5][0-9]$/);
    await expect(page.locator('#current-date')).not.toHaveText('Loading...');
});
