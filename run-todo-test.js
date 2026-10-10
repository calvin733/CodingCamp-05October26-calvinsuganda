#!/usr/bin/env node
/**
 * Simple test runner for TodoManager core tests
 */

// Mock Local Storage for testing
class LocalStorageMock {
    constructor() {
        this.store = {};
    }
    
    getItem(key) {
        return this.store[key] || null;
    }
    
    setItem(key, value) {
        this.store[key] = String(value);
    }
    
    removeItem(key) {
        delete this.store[key];
    }
    
    clear() {
        this.store = {};
    }
}

global.localStorage = new LocalStorageMock();
global.document = {
    addEventListener: () => {},
    getElementById: () => null
};

// Load the app
require('./js/app.js');

// Simple test framework
let passCount = 0;
let failCount = 0;
const tests = [];

function describe(name, fn) {
    console.log(`\n${name}`);
    fn();
}

function it(description, fn) {
    try {
        fn();
        console.log(`  ✓ ${description}`);
        passCount++;
    } catch (error) {
        console.log(`  ✗ ${description}`);
        console.log(`    Error: ${error.message}`);
        failCount++;
    }
}

function expect(value) {
    return {
        toEqual: function(expected) {
            if (JSON.stringify(value) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
            }
        },
        toBe: function(expected) {
            if (value !== expected) {
                throw new Error(`Expected ${expected}, got ${value}`);
            }
        },
        toHaveProperty: function(prop) {
            if (!(prop in value)) {
                throw new Error(`Expected object to have property '${prop}'`);
            }
        },
        toMatch: function(regex) {
            if (!regex.test(value)) {
                throw new Error(`Expected ${value} to match ${regex}`);
            }
        },
        not: {
            toBe: function(expected) {
                if (value === expected) {
                    throw new Error(`Expected ${value} not to be ${expected}`);
                }
            }
        }
    };
}

function beforeEach(fn) {
    fn();
}

// ============================================
// Tests
// ============================================

describe('TodoManager - Core Module (Task 6.1)', function() {
    
    // Initialization Tests
    describe('Initialization (init method)', function() {
        
        it('should initialize with empty tasks array when Local Storage is empty', function() {
            localStorage.clear();
            App.TodoManager.init();
            const tasks = App.TodoManager.getTasks();
            expect(tasks).toEqual([]);
        });
        
        it('should load tasks from Local Storage on init', function() {
            const testTasks = [
                { id: '1-abc', text: 'Task 1', completed: false, createdAt: 1000 },
                { id: '2-def', text: 'Task 2', completed: true, createdAt: 2000 }
            ];
            localStorage.clear();
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            const tasks = App.TodoManager.getTasks();
            expect(tasks).toEqual(testTasks);
        });
        
        it('should handle corrupted Local Storage data gracefully', function() {
            localStorage.clear();
            localStorage.setItem('dashboard_tasks', 'not-valid-json{');
            App.TodoManager.init();
            const tasks = App.TodoManager.getTasks();
            expect(tasks).toEqual([]);
        });
        
        it('should handle non-array data in Local Storage gracefully', function() {
            localStorage.clear();
            localStorage.setItem('dashboard_tasks', JSON.stringify({ id: '1', text: 'Task' }));
            App.TodoManager.init();
            const tasks = App.TodoManager.getTasks();
            expect(tasks).toEqual([]);
        });
    });

    // getTasks Method Tests
    describe('getTasks method', function() {
        
        it('should return a copy of tasks array, not the original', function() {
            localStorage.clear();
            const testTasks = [
                { id: '1-abc', text: 'Task 1', completed: false, createdAt: 1000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const retrieved = App.TodoManager.getTasks();
            retrieved.push({ id: '2-def', text: 'New Task', completed: false, createdAt: 2000 });
            
            const again = App.TodoManager.getTasks();
            if (again.length !== 1) {
                throw new Error(`Expected 1 task after modification, got ${again.length}`);
            }
        });
        
        it('should return tasks with complete data model', function() {
            localStorage.clear();
            const testTasks = [
                { 
                    id: '1705334400000-abc123',
                    text: 'Complete project docs',
                    completed: false,
                    createdAt: 1705334400000
                }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            const task = tasks[0];
            
            expect(task).toHaveProperty('id');
            expect(task).toHaveProperty('text');
            expect(task).toHaveProperty('completed');
            expect(task).toHaveProperty('createdAt');
        });
    });

    // Task Data Model Tests
    describe('Task Data Model', function() {
        
        it('should have correct structure: id, text, completed, createdAt', function() {
            localStorage.clear();
            const testTasks = [
                {
                    id: '1705334400000-abc123',
                    text: 'Complete project docs',
                    completed: false,
                    createdAt: 1705334400000
                }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            const keys = Object.keys(tasks[0]).sort();
            const expected = ['completed', 'createdAt', 'id', 'text'];
            if (JSON.stringify(keys) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(keys)}`);
            }
        });
        
        it('should have id as unique timestamp-based string', function() {
            localStorage.clear();
            const testTasks = [
                { id: '1705334400000-abc123', text: 'Task 1', completed: false, createdAt: 1000 },
                { id: '1705334400001-def456', text: 'Task 2', completed: false, createdAt: 2000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(tasks[0].id).toMatch(/^\d+-[a-z0-9]+$/);
            expect(tasks[1].id).toMatch(/^\d+-[a-z0-9]+$/);
        });
        
        it('should have text property as string', function() {
            localStorage.clear();
            const testTasks = [
                { id: '1-abc', text: 'Complete project docs', completed: false, createdAt: 1000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            if (typeof tasks[0].text !== 'string') {
                throw new Error(`Expected text to be string, got ${typeof tasks[0].text}`);
            }
            expect(tasks[0].text).toBe('Complete project docs');
        });
        
        it('should have completed property as boolean', function() {
            localStorage.clear();
            const testTasks = [
                { id: '1-abc', text: 'Task 1', completed: false, createdAt: 1000 },
                { id: '2-def', text: 'Task 2', completed: true, createdAt: 2000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            if (typeof tasks[0].completed !== 'boolean') {
                throw new Error(`Expected completed to be boolean, got ${typeof tasks[0].completed}`);
            }
            expect(tasks[0].completed).toBe(false);
            expect(tasks[1].completed).toBe(true);
        });
        
        it('should have createdAt property as Unix timestamp (number)', function() {
            localStorage.clear();
            const testTasks = [
                { id: '1-abc', text: 'Task', completed: false, createdAt: 1705334400000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            if (typeof tasks[0].createdAt !== 'number') {
                throw new Error(`Expected createdAt to be number, got ${typeof tasks[0].createdAt}`);
            }
            expect(tasks[0].createdAt).toBe(1705334400000);
        });
    });

    // Internal State Tests
    describe('Internal State Management', function() {
        
        it('should maintain tasks array internally', function() {
            localStorage.clear();
            const testTasks = [
                { id: '1-abc', text: 'Task 1', completed: false, createdAt: 1000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            if (tasks.length !== 1) {
                throw new Error(`Expected 1 task, got ${tasks.length}`);
            }
            expect(tasks[0].text).toBe('Task 1');
        });
        
        it('should track editingId state', function() {
            localStorage.clear();
            App.TodoManager.init();
            
            if (App.TodoManager._getEditingId() !== null) {
                throw new Error(`Expected editingId to be null initially`);
            }
            
            App.TodoManager._setEditingId('1-abc');
            expect(App.TodoManager._getEditingId()).toBe('1-abc');
            
            App.TodoManager._setEditingId(null);
            expect(App.TodoManager._getEditingId()).toBe(null);
        });
    });

    // Multiple Task Storage Tests
    describe('Multiple Tasks Storage', function() {
        
        it('should load and preserve multiple tasks correctly', function() {
            localStorage.clear();
            const testTasks = [
                { id: '1-a', text: 'First task', completed: false, createdAt: 1000 },
                { id: '2-b', text: 'Second task', completed: true, createdAt: 2000 },
                { id: '3-c', text: 'Third task', completed: false, createdAt: 3000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            if (tasks.length !== 3) {
                throw new Error(`Expected 3 tasks, got ${tasks.length}`);
            }
            expect(tasks[0].text).toBe('First task');
            expect(tasks[1].text).toBe('Second task');
            expect(tasks[2].text).toBe('Third task');
        });
        
        it('should preserve task order from storage', function() {
            localStorage.clear();
            const testTasks = [
                { id: '1-a', text: 'Alpha', completed: false, createdAt: 1000 },
                { id: '2-b', text: 'Beta', completed: false, createdAt: 2000 },
                { id: '3-c', text: 'Gamma', completed: false, createdAt: 3000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(tasks[0].text).toBe('Alpha');
            expect(tasks[1].text).toBe('Beta');
            expect(tasks[2].text).toBe('Gamma');
        });
    });

    // Edge Cases
    describe('Edge Cases', function() {
        
        it('should handle tasks with special characters in text', function() {
            localStorage.clear();
            const testTasks = [
                { id: '1-abc', text: 'Task with "quotes" and \'apostrophes\'', completed: false, createdAt: 1000 },
                { id: '2-def', text: 'Task with emoji and symbols <>!@#$%', completed: false, createdAt: 2000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(tasks[0].text).toBe('Task with "quotes" and \'apostrophes\'');
            if (!tasks[1].text.includes('emoji')) {
                throw new Error('Expected text to contain emoji');
            }
        });
        
        it('should handle very long task text', function() {
            localStorage.clear();
            const longText = 'A'.repeat(500);
            const testTasks = [
                { id: '1-abc', text: longText, completed: false, createdAt: 1000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            if (tasks[0].text.length !== 500) {
                throw new Error(`Expected text length 500, got ${tasks[0].text.length}`);
            }
        });
    });
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${passCount}`);
console.log(`Tests failed: ${failCount}`);
console.log('='.repeat(50));

process.exit(failCount > 0 ? 1 : 0);
