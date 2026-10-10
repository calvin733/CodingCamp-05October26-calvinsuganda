/**
 * Property-Based Tests for Focus Timer Component - Task 4.2
 * Tests timer control methods and state transitions
 * Uses: fast-check library for property-based testing
 * Validates: Requirements 3.2, 4.1, 4.2, 4.3, 4.4, 4.5
 */

describe('FocusTimer Property-Based Tests - Task 4.2', () => {
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

    describe('Property 4: Timer Display Formatting', () => {
        /**
         * For any integer value between 0 and 1500 seconds (inclusive),
         * the timer format function SHALL produce a string matching
         * the pattern MM:SS where MM is 00-25 and SS is 00-59.
         * **Validates: Requirements 3.3**
         */
        test('formatTime() always returns MM:SS format for valid seconds (0-1500)', () => {
            const fc = require('fast-check');

            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 1500 }),
                    (seconds) => {
                        const formatted = App.FocusTimer.formatTime(seconds);
                        // Pattern: MM:SS where MM is 00-25 and SS is 00-59
                        const pattern = /^([0-2][0-5]|00|01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25):[0-5][0-9]$/;
                        return pattern.test(formatted);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('formatTime() produces correct MM:SS values for boundary cases', () => {
            // 0 seconds = 00:00
            expect(App.FocusTimer.formatTime(0)).toBe('00:00');
            
            // 59 seconds = 00:59
            expect(App.FocusTimer.formatTime(59)).toBe('00:59');
            
            // 60 seconds = 01:00
            expect(App.FocusTimer.formatTime(60)).toBe('01:00');
            
            // 1500 seconds = 25:00
            expect(App.FocusTimer.formatTime(1500)).toBe('25:00');
            
            // 1499 seconds = 24:59
            expect(App.FocusTimer.formatTime(1499)).toBe('24:59');
            
            // 3599 seconds = 59:59 (edge case beyond normal range)
            expect(App.FocusTimer.formatTime(3599)).toBe('59:59');
        });
    });

    describe('Property 5: Timer State Transitions', () => {
        /**
         * For any valid timer state (stopped, running, paused),
         * the following transitions SHALL be valid:
         * - start() moves stopped→running or paused→running
         * - stop() moves running→paused
         * - the state SHALL remain consistent after each transition
         * **Validates: Requirements 4.1, 4.2, 4.3**
         */
        test('start() transitions from stopped to running and decrements', () => {
            App.FocusTimer.init();
            const initialTime = App.FocusTimer.getRemainingTime();
            
            // Call start() - should transition to running
            App.FocusTimer.start();
            jest.advanceTimersByTime(1000);
            
            // Should have decremented
            expect(App.FocusTimer.getRemainingTime()).toBe(initialTime - 1);
        });

        test('stop() transitions from running to paused and halts countdown', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            jest.advanceTimersByTime(5000);
            const pausedTime = App.FocusTimer.getRemainingTime();
            
            // Call stop() - should transition to paused
            App.FocusTimer.stop();
            
            // Advance time, should not decrement
            jest.advanceTimersByTime(5000);
            expect(App.FocusTimer.getRemainingTime()).toBe(pausedTime);
        });

        test('start() transitions from paused to running and resumes countdown', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            jest.advanceTimersByTime(10000);
            
            App.FocusTimer.stop();
            const pausedTime = App.FocusTimer.getRemainingTime();
            
            // Call start() again - should transition from paused to running
            App.FocusTimer.start();
            jest.advanceTimersByTime(3000);
            
            // Should have decremented from paused time
            expect(App.FocusTimer.getRemainingTime()).toBe(pausedTime - 3);
        });

        test('state transitions are atomic and consistent', () => {
            const fc = require('fast-check');

            // Generate random sequence of start/stop calls
            fc.assert(
                fc.property(
                    fc.array(
                        fc.oneof(
                            fc.constant('start'),
                            fc.constant('stop'),
                            fc.constant('reset')
                        ),
                        { minLength: 1, maxLength: 20 }
                    ),
                    (actions) => {
                        App.FocusTimer.init();
                        
                        actions.forEach(action => {
                            if (action === 'start') App.FocusTimer.start();
                            else if (action === 'stop') App.FocusTimer.stop();
                            else if (action === 'reset') App.FocusTimer.reset();
                            
                            jest.advanceTimersByTime(100); // Small advance
                        });
                        
                        // After any sequence, remaining time should be between 0 and 1500
                        const remaining = App.FocusTimer.getRemainingTime();
                        return remaining >= 0 && remaining <= 1500;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 6: Timer Reset', () => {
        /**
         * For any timer state (stopped, running, or paused) with any
         * remaining time value, calling reset() SHALL set remainingSeconds
         * to 1500 and state to stopped.
         * **Validates: Requirements 4.4, 4.5**
         */
        test('reset() from any state returns to 1500 seconds', () => {
            const fc = require('fast-check');

            // Test resetting at various time points
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 1500 }),
                    (timeElapsed) => {
                        App.FocusTimer.init();
                        App.FocusTimer.start();
                        
                        // Advance to some point
                        jest.advanceTimersByTime(timeElapsed * 1000);
                        
                        // Reset
                        App.FocusTimer.reset();
                        
                        // Should be back to 1500
                        return App.FocusTimer.getRemainingTime() === 1500;
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('reset() while running stops countdown', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            jest.advanceTimersByTime(20000);
            
            // Reset
            App.FocusTimer.reset();
            
            // Advance time - should not decrement further
            jest.advanceTimersByTime(10000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
        });

        test('reset() while paused returns to 1500', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            jest.advanceTimersByTime(30000);
            App.FocusTimer.stop();
            
            const pausedTime = App.FocusTimer.getRemainingTime();
            expect(pausedTime).toBeLessThan(1500);
            
            // Reset from paused state
            App.FocusTimer.reset();
            
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
        });

        test('reset() display updates to 25:00', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            jest.advanceTimersByTime(15000);
            
            App.FocusTimer.reset();
            
            expect(timerDisplay.textContent).toBe('25:00');
        });

        test('reset() from stopped state is idempotent', () => {
            App.FocusTimer.init(); // Already in stopped state
            
            App.FocusTimer.reset();
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
            
            // Reset again
            App.FocusTimer.reset();
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
        });
    });

    describe('Combined State Machine Tests', () => {
        /**
         * Test the complete state machine behavior across all transitions
         */
        test('complete state machine cycle: stopped → running → paused → running → stopped', () => {
            App.FocusTimer.init(); // stopped state, 1500 seconds
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
            
            // Transition: stopped → running
            App.FocusTimer.start();
            jest.advanceTimersByTime(5000);
            expect(App.FocusTimer.getRemainingTime()).toBe(1495);
            
            // Transition: running → paused
            App.FocusTimer.stop();
            const pausedTime = App.FocusTimer.getRemainingTime();
            jest.advanceTimersByTime(3000);
            expect(App.FocusTimer.getRemainingTime()).toBe(pausedTime); // Unchanged
            
            // Transition: paused → running
            App.FocusTimer.start();
            jest.advanceTimersByTime(2000);
            expect(App.FocusTimer.getRemainingTime()).toBe(pausedTime - 2);
            
            // Transition: running → stopped (via reset)
            App.FocusTimer.reset();
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
            jest.advanceTimersByTime(5000);
            expect(App.FocusTimer.getRemainingTime()).toBe(1500); // Unchanged after reset
        });

        test('rapid state transitions maintain consistency', () => {
            App.FocusTimer.init();
            
            // Rapid start/stop/start sequence
            App.FocusTimer.start();
            jest.advanceTimersByTime(1000);
            
            App.FocusTimer.stop();
            const time1 = App.FocusTimer.getRemainingTime();
            
            App.FocusTimer.start();
            jest.advanceTimersByTime(1000);
            
            App.FocusTimer.stop();
            const time2 = App.FocusTimer.getRemainingTime();
            
            expect(time2).toBe(time1 - 1);
            
            // Reset should work regardless
            App.FocusTimer.reset();
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
        });
    });

    describe('Countdown Accuracy Tests', () => {
        /**
         * Test that countdown accurately decrements by exactly 1 second per interval
         */
        test('timer decrements exactly 1 second per 1000ms interval', () => {
            const fc = require('fast-check');

            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 100 }),
                    (iterations) => {
                        App.FocusTimer.init();
                        App.FocusTimer.start();
                        
                        const initialTime = App.FocusTimer.getRemainingTime();
                        
                        for (let i = 0; i < iterations; i++) {
                            jest.advanceTimersByTime(1000);
                        }
                        
                        const finalTime = App.FocusTimer.getRemainingTime();
                        return finalTime === initialTime - iterations;
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('timer reaches zero and stops', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            
            // Advance to completion (1500 seconds)
            jest.advanceTimersByTime(1500000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(0);
            
            // Further advancement should not go negative
            jest.advanceTimersByTime(5000);
            expect(App.FocusTimer.getRemainingTime()).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Requirement Coverage Verification', () => {
        /**
         * Explicit tests for each requirement
         */
        test('Requirement 3.2: Timer decrements by one second every second when running', () => {
            App.FocusTimer.init();
            const before = App.FocusTimer.getRemainingTime();
            
            App.FocusTimer.start();
            jest.advanceTimersByTime(1000);
            const after = App.FocusTimer.getRemainingTime();
            
            expect(before - after).toBe(1);
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
            jest.advanceTimersByTime(10000);
            
            const timeAtStop = App.FocusTimer.getRemainingTime();
            App.FocusTimer.stop();
            jest.advanceTimersByTime(5000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(timeAtStop);
        });

        test('Requirement 4.3: Start button resumes from paused time', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            jest.advanceTimersByTime(15000);
            
            App.FocusTimer.stop();
            const pausedTime = App.FocusTimer.getRemainingTime();
            
            App.FocusTimer.start();
            jest.advanceTimersByTime(2000);
            
            expect(App.FocusTimer.getRemainingTime()).toBe(pausedTime - 2);
        });

        test('Requirement 4.4: Reset button returns to 1500 seconds', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            jest.advanceTimersByTime(50000);
            
            App.FocusTimer.reset();
            
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
        });

        test('Requirement 4.5: Reset while running stops and returns to 1500', () => {
            App.FocusTimer.init();
            App.FocusTimer.start();
            jest.advanceTimersByTime(30000);
            
            // Timer is running, now reset
            App.FocusTimer.reset();
            
            // Verify it stopped
            jest.advanceTimersByTime(5000);
            expect(App.FocusTimer.getRemainingTime()).toBe(1500);
        });
    });
});
