/**
 * TodoManager Core Tests - Task 6.1
 * Tests for TodoManager module with task data model, internal state management,
 * and initialization from Local Storage
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

// The shared Jest setup loads the browser application's App API.

describe('TodoManager - Core Module (Task 6.1)', function() {
    
    beforeEach(function() {
        // Clear localStorage before each test
        localStorage.clear();
        // Reinitialize TodoManager with clean state
        App.TodoManager.init();
    });

    // ============================================
    // Initialization Tests
    // ============================================
    
    describe('Initialization (init method)', function() {
        
        it('should initialize with empty tasks array when Local Storage is empty', function() {
            localStorage.clear();
            App.TodoManager.init();
            const tasks = App.TodoManager.getTasks();
            
            expect(tasks).toEqual([]);
            expect(Array.isArray(tasks)).toBe(true);
        });
        
        it('should load tasks from Local Storage on init', function() {
            // Prepare test data
            const testTasks = [
                { id: '1-abc', text: 'Task 1', completed: false, createdAt: 1000 },
                { id: '2-def', text: 'Task 2', completed: true, createdAt: 2000 }
            ];
            
            // Store test data
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            
            // Initialize TodoManager
            App.TodoManager.init();
            
            // Verify tasks are loaded
            const tasks = App.TodoManager.getTasks();
            expect(tasks).toEqual(testTasks);
            expect(tasks.length).toBe(2);
        });
        
        it('should handle corrupted Local Storage data gracefully', function() {
            // Store invalid JSON
            localStorage.setItem('dashboard_tasks', 'not-valid-json{');
            
            // Initialize should not crash
            expect(() => App.TodoManager.init()).not.toThrow();
            
            // Should fall back to empty array
            const tasks = App.TodoManager.getTasks();
            expect(tasks).toEqual([]);
        });
        
        it('should handle non-array data in Local Storage gracefully', function() {
            // Store an object instead of array
            localStorage.setItem('dashboard_tasks', JSON.stringify({ id: '1', text: 'Task' }));
            
            // Initialize should not crash
            expect(() => App.TodoManager.init()).not.toThrow();
            
            // Should fall back to empty array
            const tasks = App.TodoManager.getTasks();
            expect(tasks).toEqual([]);
        });
        
        it('should initialize editingId to null', function() {
            App.TodoManager.init();
            expect(App.TodoManager._getEditingId()).toBe(null);
        });
    });

    // ============================================
    // getTasks Method Tests
    // ============================================
    
    describe('getTasks method', function() {
        
        it('should return an array', function() {
            const tasks = App.TodoManager.getTasks();
            expect(Array.isArray(tasks)).toBe(true);
        });
        
        it('should return a copy of tasks array, not the original', function() {
            const testTasks = [
                { id: '1-abc', text: 'Task 1', completed: false, createdAt: 1000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const retrieved = App.TodoManager.getTasks();
            retrieved.push({ id: '2-def', text: 'New Task', completed: false, createdAt: 2000 });
            
            // Original should not be modified
            const again = App.TodoManager.getTasks();
            expect(again.length).toBe(1);
        });
        
        it('should return tasks with complete data model', function() {
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
            
            // Verify all required properties exist
            expect(task).toHaveProperty('id');
            expect(task).toHaveProperty('text');
            expect(task).toHaveProperty('completed');
            expect(task).toHaveProperty('createdAt');
            
            // Verify types
            expect(typeof task.id).toBe('string');
            expect(typeof task.text).toBe('string');
            expect(typeof task.completed).toBe('boolean');
            expect(typeof task.createdAt).toBe('number');
        });
    });

    // ============================================
    // Task Data Model Tests
    // ============================================
    
    describe('Task Data Model', function() {
        
        it('should have correct structure: id, text, completed, createdAt', function() {
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
            expect(Object.keys(tasks[0]).sort()).toEqual(['completed', 'createdAt', 'id', 'text']);
        });
        
        it('should have id as unique timestamp-based string', function() {
            const testTasks = [
                { id: '1705334400000-abc123', text: 'Task 1', completed: false, createdAt: 1000 },
                { id: '1705334400001-def456', text: 'Task 2', completed: false, createdAt: 2000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(tasks[0].id).toMatch(/^\d+-[a-z0-9]+$/);
            expect(tasks[1].id).toMatch(/^\d+-[a-z0-9]+$/);
            expect(tasks[0].id).not.toBe(tasks[1].id);
        });
        
        it('should have text property as string', function() {
            const testTasks = [
                { id: '1-abc', text: 'Complete project docs', completed: false, createdAt: 1000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(typeof tasks[0].text).toBe('string');
            expect(tasks[0].text).toBe('Complete project docs');
        });
        
        it('should have completed property as boolean', function() {
            const testTasks = [
                { id: '1-abc', text: 'Task 1', completed: false, createdAt: 1000 },
                { id: '2-def', text: 'Task 2', completed: true, createdAt: 2000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(typeof tasks[0].completed).toBe('boolean');
            expect(typeof tasks[1].completed).toBe('boolean');
            expect(tasks[0].completed).toBe(false);
            expect(tasks[1].completed).toBe(true);
        });
        
        it('should have createdAt property as Unix timestamp (number)', function() {
            const testTasks = [
                { id: '1-abc', text: 'Task', completed: false, createdAt: 1705334400000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(typeof tasks[0].createdAt).toBe('number');
            expect(tasks[0].createdAt).toBe(1705334400000);
            expect(tasks[0].createdAt > 0).toBe(true);
        });
    });

    // ============================================
    // Internal State Tests
    // ============================================
    
    describe('Internal State Management', function() {
        
        it('should maintain tasks array internally', function() {
            const testTasks = [
                { id: '1-abc', text: 'Task 1', completed: false, createdAt: 1000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(tasks.length).toBe(1);
            expect(tasks[0].text).toBe('Task 1');
        });
        
        it('should track editingId state', function() {
            // Initial state should be null
            App.TodoManager.init();
            expect(App.TodoManager._getEditingId()).toBe(null);
            
            // Should be settable
            App.TodoManager._setEditingId('1-abc');
            expect(App.TodoManager._getEditingId()).toBe('1-abc');
            
            // Should be clearable
            App.TodoManager._setEditingId(null);
            expect(App.TodoManager._getEditingId()).toBe(null);
        });
    });

    // ============================================
    // Multiple Task Storage Tests
    // ============================================
    
    describe('Multiple Tasks Storage', function() {
        
        it('should load and preserve multiple tasks correctly', function() {
            const testTasks = [
                { id: '1-a', text: 'First task', completed: false, createdAt: 1000 },
                { id: '2-b', text: 'Second task', completed: true, createdAt: 2000 },
                { id: '3-c', text: 'Third task', completed: false, createdAt: 3000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(tasks.length).toBe(3);
            expect(tasks[0].text).toBe('First task');
            expect(tasks[1].text).toBe('Second task');
            expect(tasks[2].text).toBe('Third task');
        });
        
        it('should preserve task order from storage', function() {
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

    // ============================================
    // Edge Cases
    // ============================================
    
    describe('Edge Cases', function() {
        
        it('should handle empty string task text', function() {
            const testTasks = [
                { id: '1-abc', text: '', completed: false, createdAt: 1000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(tasks[0].text).toBe('');
        });
        
        it('should handle tasks with special characters in text', function() {
            const testTasks = [
                { id: '1-abc', text: 'Task with "quotes" and \'apostrophes\'', completed: false, createdAt: 1000 },
                { id: '2-def', text: 'Task with emojis 🎉 and symbols <>', completed: false, createdAt: 2000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(tasks[0].text).toBe('Task with "quotes" and \'apostrophes\'');
            expect(tasks[1].text).toContain('🎉');
        });
        
        it('should handle very long task text', function() {
            const longText = 'A'.repeat(500);
            const testTasks = [
                { id: '1-abc', text: longText, completed: false, createdAt: 1000 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(tasks[0].text.length).toBe(500);
        });
        
        it('should handle tasks with zero createdAt timestamp', function() {
            const testTasks = [
                { id: '1-abc', text: 'Task', completed: false, createdAt: 0 }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(tasks[0].createdAt).toBe(0);
        });
        
        it('should handle very large createdAt timestamp', function() {
            const largeTimestamp = 9999999999999;
            const testTasks = [
                { id: '1-abc', text: 'Task', completed: false, createdAt: largeTimestamp }
            ];
            localStorage.setItem('dashboard_tasks', JSON.stringify(testTasks));
            App.TodoManager.init();
            
            const tasks = App.TodoManager.getTasks();
            expect(tasks[0].createdAt).toBe(largeTimestamp);
        });
    });
});
