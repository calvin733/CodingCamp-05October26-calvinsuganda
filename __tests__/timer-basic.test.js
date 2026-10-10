/**
 * Unit Tests for FocusTimer Module - Task 4.1
 * Tests basic state management and time formatting
 */

describe('FocusTimer Module - Task 4.1', () => {
    let timerDisplay;

    beforeEach(() => {
        // Set up DOM elements required by FocusTimer
        document.body.innerHTML = `
            <div id="timer-display">25:00</div>
        `;
        timerDisplay = document.getElementById('timer-display');

        // Initialize the FocusTimer module
        if (typeof App !== 'undefined' && App.FocusTimer) {
            App.FocusTimer.init();
        }
    });

    afterEach(() => {
        // Clean up
        if (typeof App !== 'undefined' && App.FocusTimer) {
            App.FocusTimer.destroy();
        }
        document.body.innerHTML = '';
    });

    describe('State Management', () => {
        test('init() should set remainingSeconds to 1500 (25 minutes)', () => {
            App.FocusTimer.init();
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
        });

        test('getRemainingTime() should return current countdown value', () => {
            const remaining = App.FocusTimer.getRemainingTime();
            expect(typeof remaining).toBe('number');
            expect(remaining).toBeGreaterThanOrEqual(0);
        });

        test('init() should update DOM element #timer-display', () => {
            App.FocusTimer.init();
            expect(timerDisplay.textContent).toBe('25:00');
        });
    });

    describe('Time Formatting', () => {
        test('formatTime(1500) should return "25:00"', () => {
            expect(App.FocusTimer.formatTime(1500)).toBe('25:00');
        });

        test('formatTime(0) should return "00:00"', () => {
            expect(App.FocusTimer.formatTime(0)).toBe('00:00');
        });

        test('formatTime(61) should return "01:01"', () => {
            expect(App.FocusTimer.formatTime(61)).toBe('01:01');
        });

        test('formatTime(599) should return "09:59"', () => {
            expect(App.FocusTimer.formatTime(599)).toBe('09:59');
        });

        test('formatTime(3599) should return "59:59"', () => {
            expect(App.FocusTimer.formatTime(3599)).toBe('59:59');
        });

        test('formatTime should pad single digits with zeros', () => {
            expect(App.FocusTimer.formatTime(5)).toBe('00:05');
            expect(App.FocusTimer.formatTime(65)).toBe('01:05');
        });
    });

    describe('Requirements Validation', () => {
        test('Requirement 3.1: Timer initializes with 25 minutes (1500 seconds)', () => {
            App.FocusTimer.init();
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
        });

        test('Requirement 3.3: Timer displays time in MM:SS format', () => {
            App.FocusTimer.init();
            const displayText = timerDisplay.textContent;
            expect(displayText).toMatch(/^\d{2}:\d{2}$/);
        });
    });
});
