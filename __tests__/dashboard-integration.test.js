const fs = require('fs');
const path = require('path');
const installPage = require('../test-utils/page');
const source = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const input = id => document.getElementById(id);
const key = (node, value) => node.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }));
beforeEach(() => { installPage(); App.init(); });

function addTask(text) { input('todo-input').value = text; input('todo-add').click(); }
function addLink(name, url) {
    input('link-name').value = name; input('link-url').value = url; input('link-add').click();
}

test('task buttons and Enter add exactly one task, clear and refocus the input', () => {
    addTask('  First task  ');
    expect(App.TodoManager.getTasks()[0].text).toBe('First task');
    expect(input('todo-input').value).toBe('');
    expect(document.activeElement).toBe(input('todo-input'));
    input('todo-input').value = 'Keyboard task'; key(input('todo-input'), 'Enter');
    expect(document.querySelectorAll('.todo-item')).toHaveLength(2);
    addTask('   ');
    expect(App.TodoManager.getTasks()).toHaveLength(2);
});

test('inline edits support save, empty rejection, cancellation and Escape', () => {
    addTask('Original');
    document.querySelector('.todo-edit').click();
    let edit = document.querySelector('.todo-text-input');
    expect(edit.value).toBe('Original'); expect(document.activeElement).toBe(edit);
    edit.value = '   '; document.querySelector('.todo-save').click();
    expect(App.TodoManager.getTasks()[0].text).toBe('Original');
    edit.value = 'Cancelled'; document.querySelector('.todo-cancel').click();
    expect(document.querySelector('.todo-text').textContent).toBe('Original');
    document.querySelector('.todo-edit').click();
    edit = document.querySelector('.todo-text-input'); edit.value = 'Escaped'; key(edit, 'Escape');
    expect(App.TodoManager.getTasks()[0].text).toBe('Original');
    document.querySelector('.todo-edit').click();
    edit = document.querySelector('.todo-text-input'); edit.value = 'Updated'; key(edit, 'Enter');
    expect(document.querySelector('.todo-text').textContent).toBe('Updated');
    expect(App.Storage.get('dashboard_tasks')[0].text).toBe('Updated');
});

test('completion preserves the DOM row, and deletion clears storage and display', () => {
    addTask('Task'); const row = document.querySelector('.todo-item');
    row.querySelector('.todo-checkbox').click();
    expect(App.TodoManager.getTasks()[0].completed).toBe(true);
    expect(row.querySelector('.todo-text').classList.contains('completed')).toBe(true);
    expect(document.querySelector('.todo-item')).toBe(row);
    row.querySelector('.todo-delete').click();
    expect(input('todo-list').children).toHaveLength(0);
    expect(App.Storage.get('dashboard_tasks')).toEqual([]);
});

test('task and link text are rendered as text rather than HTML', () => {
    const payload = '<img src=x onerror=alert(1)>';
    addTask(payload); addLink(payload, 'example.com');
    expect(document.querySelector('.todo-text').textContent).toBe(payload);
    expect(document.querySelector('.link-button').textContent).toBe(payload);
    expect(document.querySelectorAll('#todo-list img, #links-list img')).toHaveLength(0);
});

test('links support Enter, normalized URLs, safe new tabs, and delegated deletion', () => {
    jest.spyOn(window, 'open').mockImplementation(() => null);
    input('link-name').value = 'Example'; input('link-url').value = 'example.com';
    key(input('link-url'), 'Enter');
    expect(input('link-name').value).toBe(''); expect(input('link-url').value).toBe('');
    document.querySelector('.link-button').click();
    expect(window.open).toHaveBeenCalledWith('https://example.com/', '_blank', 'noopener,noreferrer');
    document.querySelector('.link-delete').click();
    expect(input('links-list').children).toHaveLength(0);
    expect(App.Storage.get('dashboard_links')).toEqual([]);
});

test('invalid URLs retain inputs and their error clears as the user types', () => {
    addLink('Example', 'javascript:alert(1)');
    expect(App.QuickLinksManager.getLinks()).toEqual([]);
    expect(input('link-url').validationMessage).toBe('Please enter a valid URL');
    input('link-url').value = 'example.com';
    input('link-url').dispatchEvent(new Event('input', { bubbles: true }));
    expect(input('link-url').validationMessage).toBe('');
    input('link-add').click(); expect(App.QuickLinksManager.getLinks()).toHaveLength(1);
});

test('a fresh application restores task edits, completion and links from browser storage', () => {
    addTask('First'); const id = App.TodoManager.getTasks()[0].id;
    App.TodoManager.editTask(id, 'Persisted'); App.TodoManager.toggleComplete(id);
    addLink('Example', 'example.com');
    const tasks = App.TodoManager.getTasks(), links = App.QuickLinksManager.getLinks();
    App.GreetingDisplay.destroy(); App.FocusTimer.destroy(); installPage();
    const fresh = new Function(source + '\nreturn App;')();
    fresh.init();
    try {
        expect(fresh.TodoManager.getTasks()).toEqual(tasks);
        expect(fresh.QuickLinksManager.getLinks()).toEqual(links);
        expect(document.querySelector('.todo-text').textContent).toBe('Persisted');
        expect(document.querySelector('.todo-checkbox').checked).toBe(true);
        expect(document.querySelector('.link-button').textContent).toBe('Example');
    } finally { fresh.GreetingDisplay.destroy(); fresh.FocusTimer.destroy(); }
});

test('corrupt JSON, invalid entries and unsafe stored links recover without crashing', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('dashboard_tasks', '{invalid');
    localStorage.setItem('dashboard_links', '[null,{"url":"javascript:alert(1)"}]');
    expect(() => App.init()).not.toThrow();
    expect(App.TodoManager.getTasks()).toEqual([]); expect(App.QuickLinksManager.getLinks()).toEqual([]);
    localStorage.setItem('dashboard_tasks', '[null,{},1]');
    App.TodoManager.init(); expect(input('todo-list').children).toHaveLength(0);
    localStorage.setItem('dashboard_links', '{}');
    App.QuickLinksManager.init(); expect(input('links-list').children).toHaveLength(0);
    addTask('Recovered'); addLink('Recovered link', 'example.com');
    expect(App.TodoManager.getTasks()).toHaveLength(1); expect(App.QuickLinksManager.getLinks()).toHaveLength(1);
});

test.each(['QuotaExceededError', 'SecurityError'])('%s preserves in-memory interaction and displays a warning', name => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Blocked', name); });
    addTask('Unsaved task'); addLink('Unsaved link', 'example.com');
    expect(document.querySelector('.todo-text').textContent).toBe('Unsaved task');
    expect(document.querySelector('.link-button').textContent).toBe('Unsaved link');
    expect(input('storage-status').hidden).toBe(false);
    expect(input('storage-status').textContent).toMatch(/Storage full|storage unavailable/);
});

test('unavailable storage is detected on startup and the dashboard remains usable', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); jest.spyOn(console, 'warn').mockImplementation(() => {});
    ['getItem', 'setItem'].forEach(method => jest.spyOn(window.Storage.prototype, method).mockImplementation(() => {
        throw new DOMException('Blocked', 'SecurityError');
    }));
    expect(() => App.init()).not.toThrow(); addTask('Memory task'); addLink('Memory link', 'example.com');
    expect(input('storage-status').textContent).toContain('Data will not persist');
    expect(App.TodoManager.getTasks()).toHaveLength(1); expect(App.QuickLinksManager.getLinks()).toHaveLength(1);
});

test('repeated initialization leaves one clock interval and one handler per control', () => {
    App.init(); App.init();
    expect(jest.getTimerCount()).toBe(1);
    addTask('One'); addLink('One link', 'example.com');
    expect(App.TodoManager.getTasks()).toHaveLength(1); expect(App.QuickLinksManager.getLinks()).toHaveLength(1);
    input('timer-start').click(); expect(input('timer-display').classList.contains('running')).toBe(true);
    jest.advanceTimersByTime(1000); expect(input('timer-display').textContent).toBe('24:59');
    input('timer-stop').click(); expect(input('timer-display').classList.contains('running')).toBe(false);
    input('timer-start').click(); input('timer-reset').click();
    expect(input('timer-display').textContent).toBe('25:00'); expect(jest.getTimerCount()).toBe(1);
});

test('unknown IDs and non-string inputs do not change saved collections', () => {
    addTask('Task'); addLink('Link', 'example.com');
    const tasks = App.TodoManager.getTasks(), links = App.QuickLinksManager.getLinks();
    expect(App.TodoManager.editTask('missing', 'changed')).toBe(false);
    expect(App.TodoManager.toggleComplete('missing')).toBe(false); expect(App.TodoManager.deleteTask('missing')).toBe(false);
    expect(App.QuickLinksManager.deleteLink('missing')).toBe(false);
    expect(App.TodoManager.addTask(null)).toBe(false); expect(App.QuickLinksManager.addLink(null, 'example.com')).toBe(false);
    expect(App.TodoManager.getTasks()).toEqual(tasks); expect(App.QuickLinksManager.getLinks()).toEqual(links);
});

test('API input limits match the HTML maxlength values', () => {
    App.TodoManager.addTask('x'.repeat(600)); App.QuickLinksManager.addLink('n'.repeat(60), 'example.com');
    expect(App.TodoManager.getTasks()[0].text).toHaveLength(input('todo-input').maxLength);
    expect(App.QuickLinksManager.getLinks()[0].name).toHaveLength(input('link-name').maxLength);
});
