const fc = require('fast-check');
const installPage = require('../test-utils/page');

const element = id => document.getElementById(id);
function submit(form, input, value) {
    element(input).value = value;
    element(form).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

beforeEach(() => { installPage(); App.init(); });

test('a name is trimmed, saved, changed, restored and explicitly cleared', () => {
    const defaultGreeting = App.GreetingDisplay.getGreeting();
    expect(element('greeting').textContent).toBe(defaultGreeting);
    submit('name-form', 'name-input', ' Calvin ');
    expect(element('greeting').textContent).toBe(defaultGreeting + ', Calvin!');
    expect(App.Storage.get('dashboard_name')).toBe('Calvin');
    expect(element('name-input').value).toBe('Calvin');
    submit('name-form', 'name-input', 'Alex');
    App.init();
    expect(element('greeting').textContent).toBe(defaultGreeting + ', Alex!');
    expect(element('name-input').value).toBe('Alex');
    element('name-clear').click();
    App.init();
    expect(element('greeting').textContent).toBe(defaultGreeting);
    expect(element('name-input').value).toBe('');
    expect(App.Storage.get('dashboard_name')).toBe('');
});

test.each(['', '  \t\n ', 'a'.repeat(81), null])('invalid name %p preserves the saved name', name => {
    App.GreetingDisplay.saveName('Calvin');
    expect(App.GreetingDisplay.saveName(name)).toBe(false);
    expect(element('greeting').textContent).toContain('Calvin!');
    expect(App.Storage.get('dashboard_name')).toBe('Calvin');
    expect(element('name-validation').hidden).toBe(false);
    expect(element('name-input').getAttribute('aria-invalid')).toBe('true');
    element('name-input').dispatchEvent(new Event('input', { bubbles: true }));
    expect(element('name-validation').hidden).toBe(true);
});

test('personalization renders text safely and survives a greeting-period boundary', () => {
    jest.setSystemTime(new Date(2026, 9, 10, 11, 59, 59));
    App.GreetingDisplay.saveName('<img src=x onerror=alert(1)>');
    expect(element('greeting').querySelector('img')).toBeNull();
    jest.advanceTimersByTime(1000);
    expect(element('greeting').textContent).toBe('Good Afternoon, <img src=x onerror=alert(1)>!');
});

test('invalid saved preferences fall back to the existing defaults', () => {
    App.Storage.set('dashboard_name', { name: 'Calvin' });
    App.Storage.set('dashboard_focus_minutes', '10');
    App.Storage.set('dashboard_theme', 'unknown');
    App.init();
    expect(element('greeting').textContent).toBe(App.GreetingDisplay.getGreeting());
    expect(element('timer-display').textContent).toBe('25:00');
    expect(document.documentElement.dataset.theme).toBe('light');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    ['dashboard_name', 'dashboard_focus_minutes', 'dashboard_theme'].forEach(key => localStorage.setItem(key, '{invalid'));
    expect(() => App.init()).not.toThrow();
    expect(App.FocusTimer.getDuration()).toBe(25);
    expect(element('name-input').value).toBe('');
});

test.each(['', ' ', '0', '-1', '181', '1.5', 'abc', Infinity, NaN, null, true])(
    'invalid duration %p preserves the running timer and saved duration', value => {
        App.FocusTimer.setDuration(10);
        App.FocusTimer.start(); jest.advanceTimersByTime(2000);
        expect(App.FocusTimer.setDuration(value)).toBe(false);
        expect(App.FocusTimer.getDuration()).toBe(10);
        expect(App.FocusTimer.getRemainingTime()).toBe(598);
        expect(App.Storage.get('dashboard_focus_minutes')).toBe(10);
        expect(element('duration-validation').hidden).toBe(false);
        jest.advanceTimersByTime(1000);
        expect(App.FocusTimer.getRemainingTime()).toBe(597);
        expect(jest.getTimerCount()).toBe(2); // Clock and one countdown.
    }
);

test('applying during running or paused sessions stops and resets; reload uses the saved duration', () => {
    element('timer-start').click(); jest.advanceTimersByTime(1000);
    submit('duration-form', 'focus-duration', '5');
    expect(element('timer-display').textContent).toBe('05:00');
    expect(element('timer-display').classList.contains('running')).toBe(false);
    expect(jest.getTimerCount()).toBe(1);
    element('timer-start').click(); element('timer-start').click();
    jest.advanceTimersByTime(1000);
    expect(element('timer-display').textContent).toBe('04:59');
    element('timer-stop').click();
    submit('duration-form', 'focus-duration', '180');
    expect(element('timer-display').textContent).toBe('180:00');
    element('timer-start').click(); element('timer-reset').click();
    expect(element('timer-display').textContent).toBe('180:00');
    App.init();
    expect(element('focus-duration').value).toBe('180');
    expect(App.FocusTimer.getRemainingTime()).toBe(10800);
    expect(jest.getTimerCount()).toBe(1);
});

test('custom duration appears in native and fallback notifications', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'Notification');
    const notification = jest.fn(); notification.permission = 'granted';
    window.Notification = notification;
    try {
        App.FocusTimer.setDuration(1); App.FocusTimer.start(); jest.advanceTimersByTime(60000);
        expect(notification).toHaveBeenCalledWith('Focus Session Complete!', expect.objectContaining({
            body: 'Your 1-minute focus session is complete.'
        }));
        notification.permission = 'denied';
        App.FocusTimer.reset(); App.FocusTimer.start(); jest.advanceTimersByTime(60000);
        expect(element('timer-notification-fallback').style.display).toBe('block');
        expect(element('timer-notification-fallback').textContent).toContain('1-minute');
        App.FocusTimer.setDuration(2);
        expect(element('timer-notification-fallback').style.display).toBe('none');
        expect(jest.getTimerCount()).toBe(1);
    } finally {
        if (descriptor) Object.defineProperty(window, 'Notification', descriptor);
        else delete window.Notification;
    }
});

test('changing duration cancels a previous completion permission request', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'Notification');
    let resolvePermission;
    const notification = jest.fn(); notification.permission = 'default';
    notification.requestPermission = jest.fn(() => new Promise(resolve => { resolvePermission = resolve; }));
    window.Notification = notification;
    try {
        App.FocusTimer.setDuration(1); App.FocusTimer.start(); jest.advanceTimersByTime(60000);
        App.FocusTimer.setDuration(2);
        notification.permission = 'granted'; resolvePermission('granted');
        await jest.advanceTimersByTimeAsync(0);
        expect(notification).not.toHaveBeenCalled();
        expect(element('timer-notification-fallback').style.display).toBe('none');
        expect(App.FocusTimer.getRemainingTime()).toBe(120);
    } finally {
        if (descriptor) Object.defineProperty(window, 'Notification', descriptor);
        else delete window.Notification;
    }
});

test('theme controls persist and restore both themes with an accessible pressed state', () => {
    expect(document.documentElement.dataset.theme).toBe('light');
    element('theme-toggle').click();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(element('theme-toggle').getAttribute('aria-pressed')).toBe('true');
    expect(element('theme-toggle').textContent).toBe('Light Mode');
    expect(App.Storage.get('dashboard_theme')).toBe('dark');
    App.init(); expect(document.documentElement.dataset.theme).toBe('dark');
    element('theme-toggle').click(); App.init();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(element('theme-toggle').getAttribute('aria-pressed')).toBe('false');
});

test.each(['QuotaExceededError', 'SecurityError'])('%s leaves preferences usable in memory with a warning', name => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Blocked', name); });
    submit('name-form', 'name-input', 'Calvin');
    submit('duration-form', 'focus-duration', '3');
    element('theme-toggle').click();
    expect(element('greeting').textContent).toContain('Calvin!');
    expect(element('timer-display').textContent).toBe('03:00');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(element('storage-status').hidden).toBe(false);
});

test('duplicate add checks loaded and completed tasks without modifying legacy data', () => {
    const saved = [
        { id: 'old', text: ' Study ', completed: true, createdAt: 1 },
        { id: 'legacy-duplicate', text: 'study', completed: false, createdAt: 2 }
    ];
    App.Storage.set('dashboard_tasks', saved); App.TodoManager.init();
    expect(App.TodoManager.addTask('STUDY')).toBe(false);
    expect(App.TodoManager.getTasks()).toEqual(saved);
    expect(App.Storage.get('dashboard_tasks')).toEqual(saved);
    expect(element('todo-validation').textContent).toBe('A task with this name already exists.');
    element('todo-input').value = 'Different';
    element('todo-input').dispatchEvent(new Event('input', { bubbles: true }));
    expect(element('todo-validation').hidden).toBe(true);
    element('todo-add').click(); expect(App.TodoManager.getTasks()).toHaveLength(3);
});

test('duplicate edit retains input/identity and cancellation clears feedback', () => {
    App.TodoManager.addTask('Study'); App.TodoManager.addTask('Read');
    const original = App.TodoManager.getTasks();
    const row = document.querySelectorAll('.todo-item')[1]; row.querySelector('.todo-edit').click();
    const edit = document.querySelector('.todo-text-input'); edit.value = ' STUDY ';
    document.querySelector('.todo-save').click();
    expect(App.TodoManager.getTasks()).toEqual(original);
    expect(edit.value).toBe(' STUDY ');
    expect(edit.getAttribute('aria-invalid')).toBe('true');
    document.querySelector('.todo-cancel').click();
    expect(element('todo-validation').hidden).toBe(true);
    expect(App.TodoManager.editTask(original[1].id, ' read ')).toBe(true);
    expect(App.TodoManager.getTasks()[1]).toEqual({ ...original[1], text: 'read' });
});

test('repeated init does not duplicate preference handlers or countdown intervals', () => {
    App.init(); App.init();
    element('theme-toggle').click(); expect(document.documentElement.dataset.theme).toBe('dark');
    submit('duration-form', 'focus-duration', '2');
    element('timer-start').click(); element('timer-start').click();
    expect(jest.getTimerCount()).toBe(2);
    jest.advanceTimersByTime(1000); expect(App.FocusTimer.getRemainingTime()).toBe(119);
});

test('Storage.clear includes preferences and preserves unrelated origin data', () => {
    App.GreetingDisplay.saveName('Calvin'); App.FocusTimer.setDuration(2); App.ThemeManager.toggle();
    localStorage.setItem('unrelated', 'keep'); App.Storage.clear(); App.init();
    expect(localStorage.getItem('unrelated')).toBe('keep');
    expect(element('name-input').value).toBe('');
    expect(App.FocusTimer.getDuration()).toBe(25);
    expect(document.documentElement.dataset.theme).toBe('light');
});

test('Property 17: duplicate normalization rejects every case/trim variant (Requirement 21)', () => {
    // Feature: todo-list-life-dashboard, Property 17: Duplicate Normalization
    const word = fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1, maxLength: 40 });
    fc.assert(fc.property(word, fc.boolean(), (name, completed) => {
        localStorage.removeItem('dashboard_tasks'); App.TodoManager.init();
        App.TodoManager.addTask(name);
        const task = App.TodoManager.getTasks()[0];
        if (completed) App.TodoManager.toggleComplete(task.id);
        App.TodoManager.init();
        const saved = App.TodoManager.getTasks();
        expect(App.TodoManager.addTask(' \t' + name.toUpperCase() + '\n ')).toBe(false);
        expect(App.TodoManager.getTasks()).toEqual(saved);
        expect(App.Storage.get('dashboard_tasks')).toEqual(saved);
    }), { numRuns: 100 });
});

test('Property 18: selected duration survives state transitions and reset (Requirement 19)', () => {
    // Feature: todo-list-life-dashboard, Property 18: Custom Duration Transitions
    fc.assert(fc.property(fc.integer({ min: 1, max: 180 }), fc.integer({ min: 0, max: 30 }), (minutes, elapsed) => {
        App.FocusTimer.setDuration(minutes);
        App.FocusTimer.start(); App.FocusTimer.start();
        jest.advanceTimersByTime(elapsed * 1000);
        expect(App.FocusTimer.getRemainingTime()).toBe(minutes * 60 - elapsed);
        App.FocusTimer.stop(); jest.advanceTimersByTime(1000);
        expect(App.FocusTimer.getRemainingTime()).toBe(minutes * 60 - elapsed);
        App.FocusTimer.start(); App.FocusTimer.reset();
        expect(App.FocusTimer.getRemainingTime()).toBe(minutes * 60);
        expect(App.Storage.get('dashboard_focus_minutes')).toBe(minutes);
        expect(jest.getTimerCount()).toBe(1);
    }), { numRuns: 100 });
});
