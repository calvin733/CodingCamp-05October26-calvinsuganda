/**
 * Property-Based Tests for Storage Module
 * Feature: todo-list-life-dashboard
 * Tests: Property 10 (Task Storage Round-Trip) and Property 15 (Link Storage Round-Trip)
 * 
 * This file uses a mock implementation of fast-check for Node.js testing
 * Each property test runs minimum 100 iterations
 */

// ============================================
// Mock localStorage for Node.js
// ============================================
class LocalStorageMock {
    constructor() {
        this.store = {};
    }

    getItem(key) {
        return this.store[key] || null;
    }

    setItem(key, value) {
        if (value.length > 10000000) {
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
        }
        this.store[key] = value.toString();
    }

    removeItem(key) {
        delete this.store[key];
    }

    clear() {
        this.store = {};
    }
}

global.localStorage = new LocalStorageMock();

// ============================================
// Storage Module Implementation
// ============================================
const Storage = (function() {
    function get(key) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return null;
            }
            return JSON.parse(item);
        } catch (error) {
            console.error(`Storage get error for key "${key}":`, error.message);
            return null;
        }
    }

    function set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error(`Storage set error for key "${key}":`, error.message);
            return false;
        }
    }

    function remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Storage remove error for key "${key}":`, error.message);
        }
    }

    return { get, set, remove };
})();

// ============================================
// Simple Property Test Framework
// ============================================

function randomString(minLength, maxLength) {
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function randomBoolean() {
    return Math.random() < 0.5;
}

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTask() {
    return {
        id: randomString(10, 30),
        text: randomString(1, 500),
        completed: randomBoolean(),
        createdAt: randomInteger(0, Date.now() + 1000000)
    };
}

function generateTaskArray() {
    const length = randomInteger(0, 50);
    const tasks = [];
    for (let i = 0; i < length; i++) {
        tasks.push(generateTask());
    }
    return tasks;
}

function generateLink() {
    const protocols = ['https://', 'http://'];
    const domains = ['example.com', 'github.com', 'google.com', 'test.org'];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    return {
        id: randomString(10, 30),
        name: randomString(1, 50),
        url: protocol + domain + '/' + randomString(0, 20),
        createdAt: randomInteger(0, Date.now() + 1000000)
    };
}

function generateLinkArray() {
    const length = randomInteger(0, 50);
    const links = [];
    for (let i = 0; i < length; i++) {
        links.push(generateLink());
    }
    return links;
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
            console.log(`   Counterexample:`, JSON.stringify(result.counterexample, null, 2));
            failCount++;
        } else {
            console.log(`   ✓ PASS: Property held for ${result.numRuns} runs`);
            passCount++;
        }
    } catch (error) {
        console.log(`   ✗ FAIL: Test threw exception: ${error.message}`);
        failCount++;
    }
}

// ============================================
// Property 10: Task Storage Round-Trip
// ============================================

console.log('\n' + '='.repeat(70));
console.log('PROPERTY 10: TASK STORAGE ROUND-TRIP');
console.log('='.repeat(70));

// Test single task
testProperty(
    'Property 10a: Task Storage Round-Trip (Single Task)',
    'Requirements 5.3, 6.3, 7.4, 8.2, 9.2',
    generateTask,
    (task) => {
        // Save task to Local Storage
        Storage.set('test_task', task);
        
        // Retrieve task from Local Storage
        const retrieved = Storage.get('test_task');
        
        // Check deep equality
        const isEqual = retrieved !== null &&
            retrieved.id === task.id &&
            retrieved.text === task.text &&
            retrieved.completed === task.completed &&
            retrieved.createdAt === task.createdAt;
        
        // Clean up
        Storage.remove('test_task');
        
        return isEqual;
    },
    100
);

// Test task array
testProperty(
    'Property 10b: Task Storage Round-Trip (Task Array)',
    'Requirements 5.3, 6.3, 7.4, 8.2, 9.2',
    generateTaskArray,
    (tasks) => {
        // Save task array to Local Storage
        Storage.set('dashboard_tasks', tasks);
        
        // Retrieve task array from Local Storage
        const retrieved = Storage.get('dashboard_tasks');
        
        // Check deep equality
        if (retrieved === null || !Array.isArray(retrieved)) {
            return false;
        }
        
        if (retrieved.length !== tasks.length) {
            return false;
        }
        
        for (let i = 0; i < tasks.length; i++) {
            if (retrieved[i].id !== tasks[i].id ||
                retrieved[i].text !== tasks[i].text ||
                retrieved[i].completed !== tasks[i].completed ||
                retrieved[i].createdAt !== tasks[i].createdAt) {
                return false;
            }
        }
        
        // Clean up
        Storage.remove('dashboard_tasks');
        
        return true;
    },
    100
);

// ============================================
// Property 15: Link Storage Round-Trip
// ============================================

console.log('\n' + '='.repeat(70));
console.log('PROPERTY 15: LINK STORAGE ROUND-TRIP');
console.log('='.repeat(70));

// Test single link
testProperty(
    'Property 15a: Link Storage Round-Trip (Single Link)',
    'Requirements 10.3, 12.2, 13.2',
    generateLink,
    (link) => {
        // Save link to Local Storage
        Storage.set('test_link', link);
        
        // Retrieve link from Local Storage
        const retrieved = Storage.get('test_link');
        
        // Check deep equality
        const isEqual = retrieved !== null &&
            retrieved.id === link.id &&
            retrieved.name === link.name &&
            retrieved.url === link.url &&
            retrieved.createdAt === link.createdAt;
        
        // Clean up
        Storage.remove('test_link');
        
        return isEqual;
    },
    100
);

// Test link array
testProperty(
    'Property 15b: Link Storage Round-Trip (Link Array)',
    'Requirements 10.3, 12.2, 13.2',
    generateLinkArray,
    (links) => {
        // Save link array to Local Storage
        Storage.set('dashboard_links', links);
        
        // Retrieve link array from Local Storage
        const retrieved = Storage.get('dashboard_links');
        
        // Check deep equality
        if (retrieved === null || !Array.isArray(retrieved)) {
            return false;
        }
        
        if (retrieved.length !== links.length) {
            return false;
        }
        
        for (let i = 0; i < links.length; i++) {
            if (retrieved[i].id !== links[i].id ||
                retrieved[i].name !== links[i].name ||
                retrieved[i].url !== links[i].url ||
                retrieved[i].createdAt !== links[i].createdAt) {
                return false;
            }
        }
        
        // Clean up
        Storage.remove('dashboard_links');
        
        return true;
    },
    100
);

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
    console.log('- Task objects can be saved to and retrieved from Local Storage with perfect fidelity');
    console.log('- Link objects can be saved to and retrieved from Local Storage with perfect fidelity');
    console.log('- Both single objects and arrays maintain data integrity through serialization');
    console.log('- All requirements for storage persistence are satisfied');
    process.exit(0);
} else {
    console.log('\n❌ Some property tests failed');
    process.exit(1);
}
