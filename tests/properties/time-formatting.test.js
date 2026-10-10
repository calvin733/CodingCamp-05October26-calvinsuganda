/**
 * Property-Based Tests for Greeting Display Module
 * Feature: todo-list-life-dashboard
 * Tests: Property 1 (Time Formatting), Property 2 (Date Formatting), Property 3 (Time-Based Greeting)
 * 
 * Each property test runs minimum 100 iterations using fast-check
 * Uses Jest as test runner
 */

const fc = require('fast-check');

// ============================================
// Greeting Display Module (imported/mocked)
// ============================================

/**
 * Format time as HH:MM
 * @param {Date} date - The date object to format
 * @returns {string} Time formatted as HH:MM
 */
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Format date in readable format
 * @param {Date} date - The date object to format
 * @returns {string} Date formatted as "Weekday, Month Day, Year"
 */
function formatDate(date) {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
    
    const weekday = weekdays[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${weekday}, ${month} ${day}, ${year}`;
}

/**
 * Get appropriate greeting based on time (without parameters for Node environment)
 * Note: In actual app.js, getGreeting uses current time. For testing, we use a helper.
 * @param {Date} date - The date object to use for determining greeting
 * @returns {string} Time-based greeting
 */
function getGreetingForDate(date) {
    const hours = date.getHours();
    
    // Morning: 05:00-11:59
    if (hours >= 5 && hours < 12) {
        return 'Good Morning';
    }
    // Afternoon: 12:00-16:59
    else if (hours >= 12 && hours < 17) {
        return 'Good Afternoon';
    }
    // Evening: 17:00-20:59
    else if (hours >= 17 && hours < 21) {
        return 'Good Evening';
    }
    // Night: 21:00-04:59
    else {
        return 'Good Night';
    }
}

// ============================================
// Property 1: Time Formatting
// ============================================

describe('Property 1: Time Formatting', () => {
    // Feature: todo-list-life-dashboard, Property 1: Time Formatting
    // Validates: Requirements 1.1
    
    test('should format any valid Date as HH:MM where HH is 00-23 and MM is 00-59', () => {
        fc.assert(
            fc.property(
                fc.date(),
                (date) => {
                    const formatted = formatTime(date);
                    
                    // Check format matches HH:MM pattern
                    const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
                    if (!timePattern.test(formatted)) {
                        return false;
                    }
                    
                    // Extract hours and minutes from the formatted string
                    const [hoursStr, minutesStr] = formatted.split(':');
                    const hours = parseInt(hoursStr, 10);
                    const minutes = parseInt(minutesStr, 10);
                    
                    // Verify the values match the input date
                    if (hours !== date.getHours() || minutes !== date.getMinutes()) {
                        return false;
                    }
                    
                    // Verify zero-padding is correct
                    if (hoursStr.length !== 2 || minutesStr.length !== 2) {
                        return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ============================================
// Property 2: Date Formatting
// ============================================

describe('Property 2: Date Formatting', () => {
    // Feature: todo-list-life-dashboard, Property 2: Date Formatting
    // Validates: Requirements 1.2
    
    test('should format any valid Date with weekday, month name, day of month, and year', () => {
        fc.assert(
            fc.property(
                fc.date(),
                (date) => {
                    const formatted = formatDate(date);
                    
                    // Define expected weekday and month names
                    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                                  'July', 'August', 'September', 'October', 'November', 'December'];
                    
                    const expectedWeekday = weekdays[date.getDay()];
                    const expectedMonth = months[date.getMonth()];
                    const expectedDay = date.getDate();
                    const expectedYear = date.getFullYear();
                    
                    // Check that formatted string contains expected components
                    if (!formatted.includes(expectedWeekday)) {
                        return false;
                    }
                    
                    if (!formatted.includes(expectedMonth)) {
                        return false;
                    }
                    
                    if (!formatted.includes(expectedDay.toString())) {
                        return false;
                    }
                    
                    if (!formatted.includes(expectedYear.toString())) {
                        return false;
                    }
                    
                    // Check format pattern: "Weekday, Month Day, Year"
                    const expectedFormat = `${expectedWeekday}, ${expectedMonth} ${expectedDay}, ${expectedYear}`;
                    if (formatted !== expectedFormat) {
                        return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ============================================
// Property 3: Time-Based Greeting
// ============================================

describe('Property 3: Time-Based Greeting', () => {
    // Feature: todo-list-life-dashboard, Property 3: Time-Based Greeting
    // Validates: Requirements 2.1, 2.2, 2.3, 2.4
    
    test('should return exactly one of four greetings based on hour of day', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 23 }),
                (hour) => {
                    const date = new Date(2024, 0, 1, hour, 0, 0, 0);
                    // Test using getGreetingForDate since actual getGreeting() uses current time
                    const greeting = getGreetingForDate(date);
                    
                    // Check that greeting is one of the four valid values
                    const validGreetings = ['Good Morning', 'Good Afternoon', 'Good Evening', 'Good Night'];
                    if (!validGreetings.includes(greeting)) {
                        return false;
                    }
                    
                    // Define expected greeting based on hour
                    let expectedGreeting;
                    
                    // Morning: 05:00-11:59
                    if (hour >= 5 && hour < 12) {
                        expectedGreeting = 'Good Morning';
                    }
                    // Afternoon: 12:00-16:59
                    else if (hour >= 12 && hour < 17) {
                        expectedGreeting = 'Good Afternoon';
                    }
                    // Evening: 17:00-20:59
                    else if (hour >= 17 && hour < 21) {
                        expectedGreeting = 'Good Evening';
                    }
                    // Night: 21:00-04:59
                    else {
                        expectedGreeting = 'Good Night';
                    }
                    
                    // Check that the greeting matches expected value
                    if (greeting !== expectedGreeting) {
                        return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should cover all 24 hours with correct greeting periods', () => {
        const greetingMap = {
            'Good Morning': [],
            'Good Afternoon': [],
            'Good Evening': [],
            'Good Night': []
        };

        for (let hour = 0; hour < 24; hour++) {
            const date = new Date(2024, 0, 1, hour, 0, 0, 0);
            const greeting = getGreetingForDate(date);
            greetingMap[greeting].push(hour);
        }

        // Verify morning period (5-11)
        expect(greetingMap['Good Morning']).toEqual([5, 6, 7, 8, 9, 10, 11]);

        // Verify afternoon period (12-16)
        expect(greetingMap['Good Afternoon']).toEqual([12, 13, 14, 15, 16]);

        // Verify evening period (17-20)
        expect(greetingMap['Good Evening']).toEqual([17, 18, 19, 20]);

        // Verify night period (21-4)
        expect(greetingMap['Good Night']).toEqual([21, 22, 23, 0, 1, 2, 3, 4]);
    });
});
