const fc = require('fast-check');
const installPage = require('../../test-utils/page');
const text = fc.fullUnicodeString({ minLength: 1, maxLength: 80 }).filter(s => s.trim().length > 0);
const whitespace = fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { maxLength: 30 }).map(a => a.join(''));
function reset() { localStorage.clear(); App.TodoManager.init(); }
beforeEach(() => { installPage(); reset(); });

test('Property 7: Task Creation - Requirements 5.1, 5.5', () => {
    fc.assert(fc.property(text, value => {
        reset();
        expect(App.TodoManager.addTask(value)).toBe(true);
        const task = App.TodoManager.getTasks()[0];
        expect(task).toEqual({ id: expect.any(String), text: value.trim(), completed: false, createdAt: Date.now() });
        expect(App.Storage.get('dashboard_tasks')).toEqual([task]);
        expect(document.querySelector('.todo-text').textContent).toBe(task.text);
    }), { numRuns: 100 });
});

test('Property 8: Task List Growth Invariant - Requirements 5.2, 8.1', () => {
    fc.assert(fc.property(fc.array(text, { minLength: 1, maxLength: 8 }), fc.nat(), (values, choice) => {
        reset();
        values.forEach((value, index) => {
            App.TodoManager.addTask(value);
            expect(App.TodoManager.getTasks()).toHaveLength(index + 1);
        });
        const tasks = App.TodoManager.getTasks();
        const removed = tasks[choice % tasks.length];
        expect(new Set(tasks.map(t => t.id)).size).toBe(tasks.length);
        App.TodoManager.deleteTask(removed.id);
        expect(App.TodoManager.getTasks()).toEqual(tasks.filter(t => t.id !== removed.id));
        expect(document.querySelectorAll('.todo-item')).toHaveLength(values.length - 1);
        expect(App.Storage.get('dashboard_tasks')).toEqual(App.TodoManager.getTasks());
    }), { numRuns: 100 });
});

test('Property 9: Task Input Validation - Requirements 5.4, 6.4', () => {
    fc.assert(fc.property(text, whitespace, (value, blank) => {
        reset(); App.TodoManager.addTask(value);
        const original = App.TodoManager.getTasks();
        expect(App.TodoManager.addTask(blank)).toBe(false);
        expect(App.TodoManager.editTask(original[0].id, blank)).toBe(false);
        expect(App.TodoManager.getTasks()).toEqual(original);
        expect(App.Storage.get('dashboard_tasks')).toEqual(original);
    }), { numRuns: 100 });
});

test('Property 11: Task Edit Preserves Identity - Requirement 6.2', () => {
    fc.assert(fc.property(text, text, (value, replacement) => {
        reset(); App.TodoManager.addTask(value);
        const original = App.TodoManager.getTasks()[0];
        App.TodoManager.editTask(original.id, replacement);
        expect(App.TodoManager.getTasks()[0]).toEqual({ ...original, text: replacement.trim() });
        expect(App.Storage.get('dashboard_tasks')).toEqual(App.TodoManager.getTasks());
    }), { numRuns: 100 });
});

test('Property 12: Task Completion Toggle - Requirements 7.1, 7.3', () => {
    fc.assert(fc.property(text, fc.boolean(), (value, completed) => {
        reset(); App.TodoManager.addTask(value);
        const id = App.TodoManager.getTasks()[0].id;
        if (completed) App.TodoManager.toggleComplete(id);
        const original = App.TodoManager.getTasks()[0];
        const row = document.querySelector('.todo-item');
        App.TodoManager.toggleComplete(id);
        expect(App.TodoManager.getTasks()[0]).toEqual({ ...original, completed: !completed });
        expect(document.querySelector('.todo-item')).toBe(row);
        expect(row.querySelector('.todo-checkbox').checked).toBe(!completed);
        expect(row.querySelector('.todo-text').classList.contains('completed')).toBe(!completed);
        App.TodoManager.toggleComplete(id);
        expect(App.TodoManager.getTasks()[0]).toEqual(original);
        expect(App.Storage.get('dashboard_tasks')).toEqual([original]);
    }), { numRuns: 100 });
});

test('IDs remain unique with the same timestamp and random value', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    for (let i = 0; i < 30; i++) App.TodoManager.addTask('Task ' + i);
    const tasks = App.TodoManager.getTasks();
    expect(new Set(tasks.map(t => t.id)).size).toBe(30);
    tasks[0].text = 'external mutation';
    expect(App.TodoManager.getTasks()[0].text).toBe('Task 0');
});
