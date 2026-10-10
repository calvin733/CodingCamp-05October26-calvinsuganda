const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.beforeEach(async ({ page }) => {
    page.applicationErrors = [];
    page.on('pageerror', error => page.applicationErrors.push(error.message));
    await page.goto('/');
});
test.afterEach(async ({ page }) => { expect(page.applicationErrors).toEqual([]); });

test('name validation, personalization, changing and default greeting survive reloads', async ({ page }) => {
    const defaultGreeting = await page.locator('#greeting').textContent();
    await page.getByLabel('Your name', { exact: true }).fill('   ');
    await page.getByRole('button', { name: 'Save Name', exact: true }).click();
    await expect(page.locator('#name-validation')).toHaveText('Please enter a name between 1 and 80 characters.');
    await expect(page.locator('#greeting')).toHaveText(defaultGreeting);
    await page.getByLabel('Your name', { exact: true }).fill(' Calvin ');
    await page.getByLabel('Your name', { exact: true }).press('Enter');
    await expect(page.locator('#greeting')).toHaveText(defaultGreeting + ', Calvin!');
    await page.reload();
    await expect(page.locator('#name-input')).toHaveValue('Calvin');
    await expect(page.locator('#greeting')).toHaveText(defaultGreeting + ', Calvin!');
    await page.locator('#name-input').fill('<img src=x onerror=alert(1)>');
    await page.getByRole('button', { name: 'Save Name', exact: true }).click();
    await expect(page.locator('#greeting img')).toHaveCount(0);
    await expect(page.locator('#greeting')).toContainText('<img src=x onerror=alert(1)>');
    await page.getByRole('button', { name: 'Use Default Greeting', exact: true }).click();
    await page.reload();
    await expect(page.locator('#greeting')).toHaveText(defaultGreeting);
});

test('custom duration persists, validates and preserves Start/Pause/Reset with a single interval', async ({ page }) => {
    await page.clock.install();
    await page.locator('#timer-start').click(); await page.clock.runFor(2000);
    await page.locator('#focus-duration').fill('0');
    await page.getByRole('button', { name: 'Apply Duration', exact: true }).click();
    await expect(page.locator('#duration-validation')).toContainText('whole number from 1 to 180');
    await page.clock.runFor(1000);
    await expect(page.locator('#timer-display')).toHaveText('24:57');
    await page.locator('#focus-duration').fill('1.5');
    await page.locator('#focus-duration').press('Enter');
    await expect(page.locator('#duration-validation')).toBeVisible();
    await page.locator('#focus-duration').fill('3');
    await page.locator('#focus-duration').press('Enter');
    await expect(page.locator('#timer-display')).toHaveText('03:00');
    await expect(page.locator('#timer-display')).not.toHaveClass(/running/);
    await page.locator('#timer-start').click(); await page.locator('#timer-start').click();
    await page.clock.runFor(1000); await expect(page.locator('#timer-display')).toHaveText('02:59');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.clock.runFor(2000); await expect(page.locator('#timer-display')).toHaveText('02:59');
    await page.locator('#timer-start').click(); await page.clock.runFor(1000);
    await expect(page.locator('#timer-display')).toHaveText('02:58');
    await page.locator('#timer-reset').click(); await expect(page.locator('#timer-display')).toHaveText('03:00');
    await page.reload(); await expect(page.locator('#focus-duration')).toHaveValue('3');
    await expect(page.locator('#timer-display')).toHaveText('03:00');
    await page.evaluate(() => { App.FocusTimer.setDuration(1); App.FocusTimer.start(); });
    await page.evaluate(() => { Object.defineProperty(window, 'Notification', { configurable: true, value: undefined }); });
    await page.clock.runFor(60000);
    await expect(page.locator('#timer-notification-fallback')).toBeVisible();
    await expect(page.locator('#timer-notification-fallback')).toContainText('1-minute');
});

test('theme toggle supports keyboard and persists light/dark preference', async ({ page }) => {
    const toggle = page.getByRole('button', { name: 'Dark mode', exact: true });
    await toggle.focus(); await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveText('Light Mode');
    await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await toggle.click(); await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});

test('duplicate feedback rejects loaded/completed tasks and duplicate edits without losing data', async ({ page }) => {
    await page.locator('#todo-input').fill('Study'); await page.locator('#todo-add').click();
    await page.locator('.todo-checkbox').check(); await page.reload();
    for (const value of ['study', ' Study ', 'STUDY']) {
        await page.locator('#todo-input').fill(value); await page.locator('#todo-input').press('Enter');
        await expect(page.locator('#todo-validation')).toHaveText('A task with this name already exists.');
        await expect(page.locator('#todo-input')).toHaveValue(value);
        await expect(page.locator('.todo-item')).toHaveCount(1);
    }
    await page.locator('#todo-input').fill('Read');
    await expect(page.locator('#todo-validation')).toBeHidden();
    await page.locator('#todo-add').click();
    await page.getByRole('button', { name: 'Edit Read', exact: true }).click();
    await page.getByLabel('Edit task', { exact: true }).fill(' STUDY ');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByLabel('Edit task', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    await page.getByLabel('Edit task', { exact: true }).press('Escape');
    await expect(page.locator('#todo-validation')).toBeHidden();
    await page.reload(); await expect(page.locator('.todo-text')).toHaveText(['Study', 'Read']);
    await expect(page.locator('.todo-checkbox').first()).toBeChecked();
    await page.getByRole('button', { name: 'Delete Study', exact: true }).click();
    await page.locator('#todo-input').fill('study'); await page.locator('#todo-add').click();
    await expect(page.locator('.todo-text')).toHaveText(['Read', 'study']);
});

for (const theme of ['light', 'dark']) {
    for (const width of [1280, 375]) {
        test(`${theme} palette is readable, responsive and accessible at ${width}px`, async ({ page }, testInfo) => {
            await page.setViewportSize({ width, height: 1100 });
            if (theme === 'dark') await page.locator('#theme-toggle').click();
            await page.locator('#todo-input').fill('Long task '.repeat(30)); await page.locator('#todo-add').click();
            await page.locator('.todo-checkbox').check();
            await page.locator('#link-name').fill('A long website name for wrapping');
            await page.locator('#link-url').fill('example.com'); await page.locator('#link-add').click();
            await page.locator('#timer-start').click();
            await page.locator('#name-input').fill(' ');
            await page.getByRole('button', { name: 'Save Name', exact: true }).click();
            await page.evaluate(() => {
                document.getElementById('storage-status').hidden = false;
                document.getElementById('storage-status').textContent = 'Browser storage unavailable. Data will not persist.';
                Object.defineProperty(window, 'Notification', { configurable: true, value: undefined });
                App.FocusTimer.showNotification();
            });
            // Wait for the short color transition before measuring the final palette.
            await expect.poll(() => page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor))
                .toBe(theme === 'dark' ? 'rgb(17, 24, 39)' : 'rgb(245, 245, 245)');
            await expect.poll(() => page.locator('#timer-notification-fallback').evaluate(el => getComputedStyle(el).opacity))
                .toBe('1');
            const results = await page.evaluate(() => {
                const rgb = color => color.match(/[0-9.]+/g).slice(0, 3).map(Number);
                const luminance = values => {
                    const linear = values.map(value => { const c = value / 255;
                        return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
                    return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
                };
                const background = el => {
                    while (el) {
                        const color = getComputedStyle(el).backgroundColor;
                        if (color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') return rgb(color);
                        el = el.parentElement;
                    }
                    return [255, 255, 255];
                };
                const visible = el => el.getClientRects().length > 0;
                const controls = Array.from(document.querySelectorAll('button, input[type=text], input[type=number], .todo-check-target')).filter(visible);
                const texts = Array.from(document.querySelectorAll('button, input[type=text], input[type=number], h1, h2, h3, label, .todo-text, .preference-hint, .validation-message, .storage-status, .notification-content p, .timer-display, .date-display')).filter(visible);
                const lowContrast = texts.map(el => {
                    const style = getComputedStyle(el), bg = background(el), opacity = Number(style.opacity);
                    const fg = rgb(style.color).map((v, i) => v * opacity + bg[i] * (1 - opacity));
                    const a = luminance(fg), b = luminance(bg);
                    return { element: el.id || el.className || el.tagName, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
                }).filter(result => result.ratio < 4.5);
                return {
                    lowContrast,
                    overflow: document.documentElement.scrollWidth > innerWidth,
                    tooSmall: controls.filter(el => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map(el => el.id || el.className),
                    focus: getComputedStyle(document.activeElement).outlineWidth,
                    colorScheme: getComputedStyle(document.documentElement).colorScheme
                };
            });
            expect(results.lowContrast).toEqual([]); expect(results.overflow).toBe(false);
            expect(results.tooSmall).toEqual([]); expect(results.focus).not.toBe('0px');
            expect(results.colorScheme).toBe(theme);
            const screenshot = await page.screenshot({ fullPage: true });
            await testInfo.attach(`${theme}-${width}.png`, { body: screenshot, contentType: 'image/png' });
            if (testInfo.project.name === 'chromium') fs.writeFileSync(path.join('/tmp', `challenges-${theme}-${width}.png`), screenshot);
            await page.emulateMedia({ reducedMotion: 'reduce' });
            expect(await page.locator('body').evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
        });
    }
}

test('preferences survive blocked storage in memory with visible warnings', async ({ page }) => {
    await page.evaluate(() => {
        Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
    });
    await page.locator('#name-input').fill('Calvin'); await page.locator('#name-input').press('Enter');
    await page.locator('#focus-duration').fill('4'); await page.locator('#focus-duration').press('Enter');
    await page.locator('#theme-toggle').click();
    await expect(page.locator('#greeting')).toContainText('Calvin!');
    await expect(page.locator('#timer-display')).toHaveText('04:00');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#storage-status')).toContainText('Data will not persist');
});

test('GitHub Pages project path serves the existing relative assets and working controls', async ({ page }) => {
    const assetResponses = [];
    page.on('response', response => {
        if (/\/(?:js\/app\.js|css\/style\.css)$/.test(new URL(response.url()).pathname)) {
            assetResponses.push({ url: response.url(), status: response.status() });
        }
    });
    await page.goto('http://127.0.0.1:8766/CodingCamp-05October26-calvinsuganda/');
    await expect(page.locator('#current-date')).not.toHaveText('Loading...');
    await page.locator('#name-input').fill('Calvin'); await page.locator('#name-input').press('Enter');
    await expect(page.locator('#greeting')).toContainText('Calvin!');
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(assetResponses).toHaveLength(2);
    assetResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.url).toContain('/CodingCamp-05October26-calvinsuganda/');
    });
});
