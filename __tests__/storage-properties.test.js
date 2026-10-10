/**
 * Feature: todo-list-life-dashboard
 * Properties 10 and 15: storage round trips against the actual application.
 * Validates: Requirements 5.3, 6.3, 7.4, 8.2, 9.2, 10.3, 12.2, 13.2
 */
const fc = require('fast-check');

const task = fc.record({
    id: fc.string(),
    text: fc.fullUnicodeString({ maxLength: 500 }),
    completed: fc.boolean(),
    createdAt: fc.nat()
});
const link = fc.record({
    id: fc.string(),
    name: fc.fullUnicodeString({ maxLength: 50 }),
    url: fc.webUrl(),
    createdAt: fc.nat()
});

describe('Storage properties', () => {
    for (const [property, key, arbitrary] of [
        [10, 'dashboard_tasks', task],
        [15, 'dashboard_links', link]
    ]) {
        for (const [kind, value] of [
            ['object', arbitrary],
            ['array', fc.array(arbitrary, { maxLength: 50 })]
        ]) {
            test(`Property ${property}: ${kind} round trip`, () => {
                fc.assert(fc.property(value, original => {
                    expect(App.Storage.set(key, original)).toBe(true);
                    expect(App.Storage.get(key)).toEqual(original);
                }), { numRuns: 100 });
            });
        }
    }
});

describe('Storage error handling and key management', () => {
    beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));

    test('missing and corrupt values return null without crashing', () => {
        expect(App.Storage.get('missing')).toBeNull();
        localStorage.setItem('dashboard_tasks', '{invalid');
        expect(App.Storage.get('dashboard_tasks')).toBeNull();
        expect(console.error).toHaveBeenCalled();
    });

    test.each(['QuotaExceededError', 'SecurityError'])('%s is handled on writes', name => {
        App.Storage.set('dashboard_tasks', [{ id: 'saved' }]);
        jest.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('Storage unavailable', name);
        });
        expect(App.Storage.set('dashboard_tasks', [])).toBe(false);
        expect(App.Storage.get('dashboard_tasks')).toEqual([{ id: 'saved' }]);
        expect(console.error).toHaveBeenCalled();
    });

    test('blocked reads return null', () => {
        jest.spyOn(window.Storage.prototype, 'getItem').mockImplementation(() => {
            throw new DOMException('Access denied', 'SecurityError');
        });
        expect(App.Storage.get('dashboard_tasks')).toBeNull();
    });

    test('circular data is rejected without overwriting saved data', () => {
        App.Storage.set('dashboard_tasks', []);
        const circular = {};
        circular.self = circular;
        expect(App.Storage.set('dashboard_tasks', circular)).toBe(false);
        expect(App.Storage.get('dashboard_tasks')).toEqual([]);
    });

    test('availability checks clean up their probe', () => {
        expect(App.Storage.isAvailable()).toBe(true);
        expect(localStorage.getItem('__storage_test__')).toBeNull();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('Access denied', 'SecurityError');
        });
        expect(App.Storage.isAvailable()).toBe(false);
    });

    test('remove and clear preserve unrelated browser storage', () => {
        localStorage.setItem('unrelated', 'keep');
        App.Storage.set('dashboard_tasks', []);
        App.Storage.set('dashboard_links', []);
        App.Storage.set('dashboard_timer_state', {});
        App.Storage.remove('dashboard_links');
        expect(App.Storage.get('dashboard_links')).toBeNull();
        App.Storage.clear();
        expect(App.Storage.get('dashboard_tasks')).toBeNull();
        expect(App.Storage.get('dashboard_timer_state')).toBeNull();
        expect(localStorage.getItem('unrelated')).toBe('keep');
    });
});
