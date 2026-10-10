/** Greeting DOM checks for core-module checkpoint 5.
 * Properties 1-3 are in tests/properties/time-formatting.test.js.
 * Validates: Requirements 1.1-1.4 and 2.1-2.4.
 */
describe('Greeting display integration', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <h1 id="greeting"></h1>
            <div id="current-time"></div>
            <div id="current-date"></div>`;
        jest.setSystemTime(new Date(2026, 9, 10, 11, 59, 59));
    });

    test('initializes time, date and greeting immediately in local time', () => {
        App.GreetingDisplay.init();
        expect(document.getElementById('current-time').textContent).toBe('11:59');
        expect(document.getElementById('current-date').textContent).toBe('Saturday, October 10, 2026');
        expect(document.getElementById('greeting').textContent).toBe('Good Morning');
    });

    test('updates the minute and greeting at a period boundary', () => {
        App.GreetingDisplay.init();
        jest.advanceTimersByTime(1000);
        expect(document.getElementById('current-time').textContent).toBe('12:00');
        expect(document.getElementById('greeting').textContent).toBe('Good Afternoon');
    });

    test('updates the date across midnight', () => {
        jest.setSystemTime(new Date(2026, 9, 10, 23, 59, 59));
        App.GreetingDisplay.init();
        jest.advanceTimersByTime(1000);
        expect(document.getElementById('current-time').textContent).toBe('00:00');
        expect(document.getElementById('current-date').textContent).toBe('Sunday, October 11, 2026');
        expect(document.getElementById('greeting').textContent).toBe('Good Night');
    });

    test('destroy stops subsequent clock updates', () => {
        App.GreetingDisplay.init();
        App.GreetingDisplay.destroy();
        jest.advanceTimersByTime(1000);
        expect(document.getElementById('current-time').textContent).toBe('11:59');
        expect(jest.getTimerCount()).toBe(0);
    });
});
