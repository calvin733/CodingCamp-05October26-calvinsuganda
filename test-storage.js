/**
 * Node.js test for Storage module
 * Tests Storage abstraction layer with jsdom for localStorage simulation
 */

// Mock localStorage for Node.js environment
class LocalStorageMock {
    constructor() {
        this.store = {};
    }

    getItem(key) {
        return this.store[key] || null;
    }

    setItem(key, value) {
        // Simulate QuotaExceededError for very large values
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

// Set up global localStorage
global.localStorage = new LocalStorageMock();

// Storage Module (extracted from app.js for testing)
const Storage = (function() {
    function get(key) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return null;
            }
            return JSON.parse(item);
        } catch (error) {
            if (error instanceof SyntaxError) {
                console.error(`Storage get error - JSON parse failed for key "${key}":`, error.message);
            } else if (error.name === 'SecurityError') {
                console.error(`Storage get error - SecurityError for key "${key}":`, error.message);
            } else {
                console.error(`Storage get error for key "${key}":`, error.message);
            }
            return null;
        }
    }

    function set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error(`Storage set error - Quota exceeded for key "${key}":`, error.message);
            } else if (error.name === 'SecurityError') {
                console.error(`Storage set error - SecurityError for key "${key}":`, error.message);
            } else {
                console.error(`Storage set error for key "${key}":`, error.message);
            }
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

    function clear() {
        try {
            const appKeys = ['dashboard_tasks', 'dashboard_links', 'dashboard_timer_state'];
            appKeys.forEach(function(key) {
                localStorage.removeItem(key);
            });
        } catch (error) {
            console.error('Storage clear error:', error.message);
        }
    }

    function isAvailable() {
        try {
            const testKey = '__storage_test__';
            const testValue = 'test';
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            return retrieved === testValue;
        } catch (error) {
            console.warn('Local Storage is not available:', error.message);
            return false;
        }
    }

    return {
        get: get,
        set: set,
        remove: remove,
        clear: clear,
        isAvailable: isAvailable
    };
})();

// Test Suite
console.log('=== Storage Module Test Suite ===\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
    try {
        const result = fn();
        if (result) {
            console.log(`✓ PASS: ${name}`);
            passCount++;
        } else {
            console.log(`✗ FAIL: ${name}`);
            failCount++;
        }
    } catch (error) {
        console.log(`✗ FAIL: ${name} - ${error.message}`);
        failCount++;
    }
}

// Run tests
test('isAvailable() returns true', () => {
    return Storage.isAvailable() === true;
});

test('set and get with string', () => {
    Storage.set('test_string', 'Hello, World!');
    return Storage.get('test_string') === 'Hello, World!';
});

test('set and get with object', () => {
    const testObj = { id: '123', text: 'Test Task', completed: false };
    Storage.set('test_object', testObj);
    const retrieved = Storage.get('test_object');
    return retrieved && 
        retrieved.id === '123' && 
        retrieved.text === 'Test Task' && 
        retrieved.completed === false;
});

test('set and get with array', () => {
    const testArray = [
        { id: '1', text: 'Task 1', completed: false },
        { id: '2', text: 'Task 2', completed: true }
    ];
    Storage.set('test_array', testArray);
    const retrieved = Storage.get('test_array');
    return retrieved && 
        Array.isArray(retrieved) && 
        retrieved.length === 2 &&
        retrieved[0].id === '1' &&
        retrieved[1].completed === true;
});

test('get non-existent key returns null', () => {
    return Storage.get('non_existent_key') === null;
});

test('remove() deletes key', () => {
    Storage.set('test_remove', 'will be removed');
    Storage.remove('test_remove');
    return Storage.get('test_remove') === null;
});

test('clear() removes app data', () => {
    Storage.set('dashboard_tasks', [{ id: '1' }]);
    Storage.set('dashboard_links', [{ id: '2' }]);
    Storage.clear();
    return Storage.get('dashboard_tasks') === null && 
           Storage.get('dashboard_links') === null;
});

test('handle corrupted JSON gracefully', () => {
    localStorage.setItem('corrupted', '{invalid json}');
    const result = Storage.get('corrupted');
    localStorage.removeItem('corrupted');
    return result === null;
});

test('handle special characters', () => {
    const special = 'Task with "quotes", emoji 🚀, and symbols: < > & \' "';
    Storage.set('test_special', special);
    const retrieved = Storage.get('test_special');
    Storage.remove('test_special');
    return retrieved === special;
});

test('handle empty string', () => {
    Storage.set('test_empty', '');
    const retrieved = Storage.get('test_empty');
    Storage.remove('test_empty');
    return retrieved === '';
});

test('handle boolean values', () => {
    Storage.set('test_bool_true', true);
    Storage.set('test_bool_false', false);
    const t = Storage.get('test_bool_true');
    const f = Storage.get('test_bool_false');
    Storage.remove('test_bool_true');
    Storage.remove('test_bool_false');
    return t === true && f === false;
});

test('handle number values', () => {
    Storage.set('test_number', 42);
    Storage.set('test_float', 3.14159);
    const n = Storage.get('test_number');
    const fl = Storage.get('test_float');
    Storage.remove('test_number');
    Storage.remove('test_float');
    return n === 42 && fl === 3.14159;
});

test('handle null value', () => {
    Storage.set('test_null', null);
    const retrieved = Storage.get('test_null');
    Storage.remove('test_null');
    return retrieved === null;
});

test('handle nested objects', () => {
    const nested = {
        id: '1',
        data: {
            nested: {
                deep: 'value'
            }
        },
        array: [1, 2, { key: 'value' }]
    };
    Storage.set('test_nested', nested);
    const retrieved = Storage.get('test_nested');
    Storage.remove('test_nested');
    return retrieved && 
        retrieved.data.nested.deep === 'value' &&
        retrieved.array[2].key === 'value';
});

test('set() returns true on success', () => {
    return Storage.set('test_return', 'value') === true;
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total: ${passCount + failCount}`);
console.log(`Pass: ${passCount}`);
console.log(`Fail: ${failCount}`);

if (failCount === 0) {
    console.log('\n✓ All tests passed!');
    process.exit(0);
} else {
    console.log('\n✗ Some tests failed');
    process.exit(1);
}
