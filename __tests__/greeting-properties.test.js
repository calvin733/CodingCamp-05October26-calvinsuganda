/**
 * Property-Based Tests for Greeting Display Module
 * Feature: todo-list-life-dashboard
 * Tests: Property 1 (Time Formatting), Property 2 (Date Formatting), Property 3 (Time-Based Greeting)
 * 
 * Each property test runs minimum 100 iterations
 */

// ============================================
// Greeting Display Module Implementation (for testing)
// ============================================
const GreetingDisplay = (function() {
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
     * Get appropriate greeting based on time
     * @param {Date} date - The date object (defaults to now)
     * @returns {string} Time-based greeting
     */
    function getGreeting(date) {
        const targetDate = date || new Date();
        const hours = targetDate.getHours();
        
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

    return {
        formatTime: formatTime,
        formatDate: formatDate,
        getGreeting: getGreeting
    };
})();

// ============================================
// Simple Property Test Framework
// ============================================

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomDate() {
    // Generate random date between year 2000 and 2100
    const year = randomInteger(2000, 2100);
    const month = randomInteger(0, 11);
    const day = randomInteger(1, 28); // Use 28 to avoid month-specific logic
    const hours = randomInteger(0, 23);
    const minutes = randomInteger(0, 59);
    const seconds = randomInteger(0, 59);
    const milliseconds = randomInteger(0, 999);
    
    return new Date(year, month, day, hours, minutes, seconds, milliseconds);
}

function generateRandomHour() {
    return randomInteger(0, 23);
}

function checkProperty(generator, predicate, numRuns = 100) {
    for (let i = 0; i < numRuns; i++) {
        const input = generator();
        const result = predicate(input);
        if (!result) {
            return {
                failed: true,
                numRuns: i + 1,
                counterexample: input
            };
        }
    }
    return {
        failed: false,
        numRuns: numRuns
    };
}

// ============================================
// Test Utilities
// ============================================

let passCount = 0;
let failCount = 0;

function testProperty(name, validates, generator, predicate, numRuns = 100) {
    console.log(`\n📋 ${name}`);
    console.log(`   Validates: ${validates}`);
    
    try {
        const result = checkProperty(generator, predicate, numRuns);
        
        if (result.failed) {
            console.log(`   ✗ FAIL: Property violated after ${result.numRuns} runs`);
            console.log(`   Counterexample:`, result.counterexample);
            if (result.counterexample instanceof Date) {
                console.log(`   Date details: ${result.counterexample.toISOString()}`);
            }
            failCount++;
        } else {
            console.log(`   ✓ PASS: Property held for ${result.numRuns} runs`);
            passCount++;
        }
    } catch (error) {
        console.log(`   ✗ FAIL: Test threw exception: ${error.message}`);
        console.log(`   Stack trace: ${error.stack}`);
        failCount++;
    }
}

// ============================================
// Property 1: Time Formatting
// ============================================

console.log('\n' + '='.repeat(70));
console.log('PROPERTY 1: TIME FORMATTING');
console.log('='.repeat(70));

testProperty(
    'Property 1: Time Formatting',
    'Requirements 1.1',
    generateRandomDate,
    (date) => {
        const formatted = GreetingDisplay.formatTime(date);
        
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
    },
    100
);

// ============================================
// Property 2: Date Formatting
// ============================================

console.log('\n' + '='.repeat(70));
console.log('PROPERTY 2: DATE FORMATTING');
console.log('='.repeat(70));

testProperty(
    'Property 2: Date Formatting',
    'Requirements 1.2',
    generateRandomDate,
    (date) => {
        const formatted = GreetingDisplay.formatDate(date);
        
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
    },
    100
);

// ============================================
// Property 3: Time-Based Greeting
// ============================================

console.log('\n' + '='.repeat(70));
console.log('PROPERTY 3: TIME-BASED GREETING');
console.log('='.repeat(70));

testProperty(
    'Property 3: Time-Based Greeting',
    'Requirements 2.1, 2.2, 2.3, 2.4',
    () => {
        // Generate a date with specific hour for greeting testing
        const hour = generateRandomHour();
        const date = new Date(2024, 0, 1, hour, 0, 0, 0);
        return { date, hour };
    },
    ({ date, hour }) => {
        const greeting = GreetingDisplay.getGreeting(date);
        
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
            console.log(`      Hour ${hour}: expected "${expectedGreeting}", got "${greeting}"`);
            return false;
        }
        
        // Check that greeting is one of the four valid values
        const validGreetings = ['Good Morning', 'Good Afternoon', 'Good Evening', 'Good Night'];
        if (!validGreetings.includes(greeting)) {
            return false;
        }
        
        return true;
    },
    100
);

// Additional test: Verify all hours are covered
console.log('\n📋 Property 3 Supplement: Coverage of All Hours');
console.log('   Validates: Requirements 2.1, 2.2, 2.3, 2.4');

let allHoursCovered = true;
const greetingCounts = {
    'Good Morning': 0,
    'Good Afternoon': 0,
    'Good Evening': 0,
    'Good Night': 0
};

for (let hour = 0; hour < 24; hour++) {
    const date = new Date(2024, 0, 1, hour, 0, 0, 0);
    const greeting = GreetingDisplay.getGreeting(date);
    
    // Track greeting counts
    if (greetingCounts.hasOwnProperty(greeting)) {
        greetingCounts[greeting]++;
    } else {
        console.log(`   ✗ FAIL: Invalid greeting "${greeting}" for hour ${hour}`);
        allHoursCovered = false;
        break;
    }
    
    // Verify specific mappings
    if (hour >= 5 && hour < 12 && greeting !== 'Good Morning') {
        console.log(`   ✗ FAIL: Hour ${hour} should be "Good Morning", got "${greeting}"`);
        allHoursCovered = false;
        break;
    }
    if (hour >= 12 && hour < 17 && greeting !== 'Good Afternoon') {
        console.log(`   ✗ FAIL: Hour ${hour} should be "Good Afternoon", got "${greeting}"`);
        allHoursCovered = false;
        break;
    }
    if (hour >= 17 && hour < 21 && greeting !== 'Good Evening') {
        console.log(`   ✗ FAIL: Hour ${hour} should be "Good Evening", got "${greeting}"`);
        allHoursCovered = false;
        break;
    }
    if ((hour >= 21 || hour < 5) && greeting !== 'Good Night') {
        console.log(`   ✗ FAIL: Hour ${hour} should be "Good Night", got "${greeting}"`);
        allHoursCovered = false;
        break;
    }
}

if (allHoursCovered) {
    console.log('   ✓ PASS: All 24 hours mapped correctly');
    console.log(`   Distribution: Morning=${greetingCounts['Good Morning']}, Afternoon=${greetingCounts['Good Afternoon']}, Evening=${greetingCounts['Good Evening']}, Night=${greetingCounts['Good Night']}`);
    passCount++;
} else {
    failCount++;
}

// ============================================
// Test Summary
// ============================================

console.log('\n' + '='.repeat(70));
console.log('TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total Tests: ${passCount + failCount}`);
console.log(`✓ Passed: ${passCount}`);
console.log(`✗ Failed: ${failCount}`);

if (failCount === 0) {
    console.log('\n🎉 All property tests passed!');
    console.log('\nConclusion:');
    console.log('- Time formatting produces valid HH:MM format for all dates');
    console.log('- Date formatting produces readable format with weekday, month, day, and year');
    console.log('- Time-based greeting correctly maps all 24 hours to appropriate greetings');
    console.log('- All requirements for greeting display are satisfied');
    process.exit(0);
} else {
    console.log('\n❌ Some property tests failed');
    process.exit(1);
}
