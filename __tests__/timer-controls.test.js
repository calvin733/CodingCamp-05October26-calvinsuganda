/**
 * Unit Tests for FocusTimer Control Methods - Task 4.2
 * Tests start(), stop(), and reset() functionality
 * Validates: Requirements 3.2, 4.1, 4.2, 4.3, 4.4, 4.5
 */

describe('FocusTimer Control Methods - Task 4.2', () => {
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

        // Use fake timers to control setInterval
        jest.useFakeTimers();
    });

    afterEach(() => {
        // Clean up
        if (typeof App !== 'undefined' && App.FocusTimer) {
            App.FocusTimer.destroy();
        }
        document.body.innerHTML = '';
        
        // Restore real timers
        jest.useRealTimers();
    });

    describe('start() method', () => {
        test('start() should begin countdown from 1500 seconds', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            // Advance timer by 1 second
            jest.advanceTimersByTime(1000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(1499);
        });

        test('start() should decrement by 1 every second', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            // Advance by 5 seconds
            jest.advanceTimersByTime(5000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(1495);
        });

        test('start() should update display as time decrements', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            // Advance by 1 second
            jest.advanceTimersByTime(1000);
            
            expect(timerDisplay.textContent).toBe('24:59');
        });

        test('start() should resume from paused time', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            // Run for 5 seconds
            jest.advanceTimersByTime(5000);
            
            // Pause
            App.FocusTimer.stop();
            const pausedTime = App.FocusTimer.getRemainingTime();
            expect(pausedTime).toBe(1495);
            
            // Resume
            App.FocusTimer.start();
            
            // Run for 2 more seconds
            jest.advanceTimersByTime(2000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(1493);
        });

        test('start() should not start multiple intervals if called repeatedly', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            App.FocusTimer.start(); // Call again while running
            
            // Advance by 1 second
            jest.advanceTimersByTime(1000);
            
            // Should only decrement by 1, not 2
            expect(App.FocusTimer.getRemainingTime()).toBe(1499);
        });
    });

    describe('stop() method', () => {
        test('stop() should pause countdown', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            // Run for 3 seconds
            jest.advanceTimersByTime(3000);
            expect(App.FocusTimer.getRemainingTime()).toBe(1497);
            
            // Stop the timer
            App.FocusTimer.stop();
            
            // Advance time - timer should not decrement
            jest.advanceTimersByTime(5000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(1497);
        });

        test('stop() should keep current time value when paused', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            jest.advanceTimersByTime(10000);
            const timeBeforeStop = App.FocusTimer.getRemainingTime();
            
            App.FocusTimer.stop();
            
            expect(App.FocusTimer.getRemainingTime()).toBe(timeBeforeStop);
        });

        test('stop() when not running should have no effect', () => {
            App.FocusTimer.init();
            const initialTime = App.FocusTimer.getRemainingTime();
            
            App.FocusTimer.stop();
            
            expect(App.FocusTimer.getRemainingTime()).toBe(initialTime);
        });
    });

    describe('reset() method', () => {
        test('reset() should return to 1500 seconds from any state', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            // Run for some time
            jest.advanceTimersByTime(30000); // 30 seconds
            expect(App.FocusTimer.getRemainingTime()).toBe(1470);
            
            App.FocusTimer.reset();
            
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
        });

        test('reset() should stop running timer', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            jest.advanceTimersByTime(5000);
            
            App.FocusTimer.reset();
            
            // Advance time - timer should not decrement after reset
            jest.advanceTimersByTime(5000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
        });

        test('reset() should update display to 25:00', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            jest.advanceTimersByTime(10000);
            
            App.FocusTimer.reset();
            
            expect(timerDisplay.textContent).toBe('25:00');
        });

        test('reset() from paused state should return to 1500', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            jest.advanceTimersByTime(20000);
            App.FocusTimer.stop();
            
            App.FocusTimer.reset();
            
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
            expect(timerDisplay.textContent).toBe('25:00');
        });

        test('reset() from stopped state should return to 1500', () => {
            App.FocusTimer.init();
            // Don't start, just reset
            
            App.FocusTimer.reset();
            
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
            expect(timerDisplay.textContent).toBe('25:00');
        });
    });

    describe('Timer reaches zero', () => {
        test('timer should stop at 00:00', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            // Fast forward to completion (1500 seconds)
            jest.advanceTimersByTime(1500000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(0);
            expect(timerDisplay.textContent).toBe('00:00');
            
            // Advance more time - should stay at 0
            jest.advanceTimersByTime(5000);
            expect(App.FocusTimer.getRemainingTime()).toBe(0);
        });

        test('timer should prevent negative values', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            // Advance beyond completion
            jest.advanceTimersByTime(1600000); // 1600 seconds
            
            expect(App.FocusTimer.getRemainingTime()).toBeGreaterThanOrEqual(0);
        });
    });

    describe('State Transitions', () => {
        test('stopped → running transition', () => {
            App.FocusTimer.init(); // stopped state
            
            App.FocusTimer.start(); // transition to running
            jest.advanceTimersByTime(1000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(1499);
        });

        test('running → paused transition', () => {
            App.FocusTimer.init();
            App.FocusTimer.start(); // running
            
            jest.advanceTimersByTime(5000);
            App.FocusTimer.stop(); // transition to paused
            
            const pausedTime = App.FocusTimer.getRemainingTime();
            jest.advanceTimersByTime(5000);
            
            // Time should not change when paused
            expect(App.FocusTimer.getRemainingTime()).toBe(pausedTime);
        });

        test('paused → running transition', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            jest.advanceTimersByTime(5000);
            
            App.FocusTimer.stop(); // paused
            const pausedTime = App.FocusTimer.getRemainingTime();
            
            App.FocusTimer.start(); // resume to running
            jest.advanceTimersByTime(3000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(pausedTime - 3);
        });
    });

    describe('Requirements Validation', () => {
        test('Requirement 3.2: Timer decrements by one second every second when running', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            const initialTime = App.FocusTimer.getRemainingTime();
            jest.advanceTimersByTime(1000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(initialTime - 1);
        });

        test('Requirement 4.1: Start button begins countdown', () => {
            App.FocusTimer.init();
            const initialTime = App.FocusTimer.getRemainingTime();
            
            App.FocusTimer.start();
            jest.advanceTimersByTime(1000);
            
            expect(App.FocusTimer.getRemainingTime()).toBeLessThan(initialTime);
        });

        test('Requirement 4.2: Stop button pauses at current time', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            jest.advanceTimersByTime(7000);
            const timeAtStop = App.FocusTimer.getRemainingTime();
            
            App.FocusTimer.stop();
            jest.advanceTimersByTime(5000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(timeAtStop);
        });

        test('Requirement 4.3: Start button resumes from paused time', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            jest.advanceTimersByTime(10000);
            
            App.FocusTimer.stop();
            const pausedTime = App.FocusTimer.getRemainingTime();
            
            App.FocusTimer.start();
            jest.advanceTimersByTime(1000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(pausedTime - 1);
        });

        test('Requirement 4.4: Reset button returns to 1500 seconds', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            jest.advanceTimersByTime(15000);
            
            App.FocusTimer.reset();
            
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
        });

        test('Requirement 4.5: Reset while running stops and returns to 1500', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            jest.advanceTimersByTime(20000);
            
            App.FocusTimer.reset();
            
            // Verify it's stopped (time doesn't change)
            jest.advanceTimersByTime(5000);
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
        });
    });
});
