/**
 * Todo List Life Dashboard
 * A client-side web application for managing tasks, time awareness, focus sessions, and quick links
 * Architecture: Module Pattern with IIFE for isolated namespaces
 * Storage: Browser Local Storage for data persistence
 */

const App = (function() {
    'use strict';

    // ============================================
    // Storage Module
    // ============================================
    const Storage = (function() {
        /**
         * Storage abstraction layer for Local Storage
         * Provides error handling for quota exceeded, security errors, and JSON parse errors
         * Validates: Requirements 5.3, 6.3, 7.4, 8.2, 9.1, 9.3, 10.3, 12.2, 13.1, 13.3
         */

        /**
         * Retrieve and parse data from Local Storage
         * @param {string} key - The storage key
         * @returns {any} Parsed data or null if key doesn't exist or error occurs
         */
        function get(key) {
            try {
                const item = localStorage.getItem(key);
                if (item === null) {
                    return null;
                }
                return JSON.parse(item);
            } catch (error) {
                if (error instanceof SyntaxError) {
                    // JSON parse error - corrupted data
                    console.error(`Storage get error - JSON parse failed for key "${key}":`, error);
                } else if (error.name === 'SecurityError') {
                    // Security error - private browsing or disabled storage
                    console.error(`Storage get error - SecurityError for key "${key}":`, error);
                } else {
                    // Other errors
                    console.error(`Storage get error for key "${key}":`, error);
                }
                return null;
            }
        }

        /**
         * Serialize and store data to Local Storage
         * @param {string} key - The storage key
         * @param {any} value - The value to store (will be JSON serialized)
         * @returns {boolean} True if successful, false if error occurs
         */
        function set(key, value) {
            try {
                const serialized = JSON.stringify(value);
                localStorage.setItem(key, serialized);
                return true;
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    // Storage quota exceeded
                    console.error(`Storage set error - Quota exceeded for key "${key}":`, error);
                    // Could display user-friendly message here if needed
                } else if (error.name === 'SecurityError') {
                    // Security error - private browsing or disabled storage
                    console.error(`Storage set error - SecurityError for key "${key}":`, error);
                } else {
                    // Other errors (e.g., circular reference in JSON.stringify)
                    console.error(`Storage set error for key "${key}":`, error);
                }
                return false;
            }
        }

        /**
         * Remove data from Local Storage
         * @param {string} key - The storage key to remove
         */
        function remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error(`Storage remove error for key "${key}":`, error);
            }
        }

        /**
         * Clear all application data from Local Storage
         * This removes all keys used by the dashboard
         */
        function clear() {
            try {
                // Remove specific app keys to avoid clearing unrelated storage
                const appKeys = ['dashboard_tasks', 'dashboard_links', 'dashboard_timer_state'];
                appKeys.forEach(function(key) {
                    localStorage.removeItem(key);
                });
            } catch (error) {
                console.error('Storage clear error:', error);
            }
        }

        /**
         * Check if Local Storage is available and functioning
         * @returns {boolean} True if Local Storage is available, false otherwise
         */
        function isAvailable() {
            try {
                const testKey = '__storage_test__';
                const testValue = 'test';
                localStorage.setItem(testKey, testValue);
                const retrieved = localStorage.getItem(testKey);
                localStorage.removeItem(testKey);
                return retrieved === testValue;
            } catch (error) {
                console.warn('Local Storage is not available:', error);
                return false;
            }
        }

        // Public API
        return {
            get: get,
            set: set,
            remove: remove,
            clear: clear,
            isAvailable: isAvailable
        };
    })();

    // ============================================
    // Greeting Display Module
    // ============================================
    const GreetingDisplay = (function() {
        /**
         * Greeting Display Component
         * Displays current time, date, and time-based greeting
         * Updates every second
         * Validates: Requirements 1.1, 1.2, 1.3, 1.4
         */

        // Internal state
        let clockInterval = null;

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
         * Get appropriate greeting based on current time
         * @returns {string} Time-based greeting
         */
        function getGreeting() {
            const now = new Date();
            const hours = now.getHours();
            
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

        /**
         * Update time, date, and greeting in DOM
         */
        function updateTime() {
            const now = new Date();
            
            // Update time display
            const timeElement = document.getElementById('current-time');
            if (timeElement) {
                timeElement.textContent = formatTime(now);
            }
            
            // Update date display
            const dateElement = document.getElementById('current-date');
            if (dateElement) {
                dateElement.textContent = formatDate(now);
            }
            
            // Update greeting
            const greetingElement = document.getElementById('greeting');
            if (greetingElement) {
                greetingElement.textContent = getGreeting();
            }
        }

        /**
         * Initialize greeting display and start clock
         */
        function init() {
            // Update immediately on init
            updateTime();
            
            // Set up interval to update every second (1000ms)
            clockInterval = setInterval(updateTime, 1000);
        }

        /**
         * Clean up intervals
         */
        function destroy() {
            if (clockInterval !== null) {
                clearInterval(clockInterval);
                clockInterval = null;
            }
        }

        // Public API
        return {
            init: init,
            updateTime: updateTime,
            getGreeting: getGreeting,
            destroy: destroy,
            // Expose formatting functions for testing
            formatTime: formatTime,
            formatDate: formatDate
        };
    })();

    // ============================================
    // Focus Timer Module
    // ============================================
    const FocusTimer = (function() {
        /**
         * Focus Timer Component
         * Provides a 25-minute Pomodoro focus timer with countdown functionality
         * Includes notification when timer completes
         * Validates: Requirements 3.1, 3.3, 3.4, 3.5
         */

        // Internal state
        let remainingSeconds = 1500; // 25 minutes in seconds
        let isRunning = false;
        let timerInterval = null;
        let hasNotified = false; // Flag to ensure notification fires only once per completion

        /**
         * Format seconds as MM:SS
         * @param {number} seconds - The number of seconds to format
         * @returns {string} Time formatted as MM:SS
         */
        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            return `${minutes}:${secs}`;
        }

        /**
         * Get current remaining time
         * @returns {number} Remaining seconds
         */
        function getRemainingTime() {
            return remainingSeconds;
        }

        /**
         * Update timer display in DOM
         */
        function updateDisplay() {
            const timerDisplay = document.getElementById('timer-display');
            if (timerDisplay) {
                timerDisplay.textContent = formatTime(remainingSeconds);
            }
        }

        /**
         * Check if browser supports Notification API
         * @returns {boolean} True if Notification API is available
         */
        function checkNotificationSupport() {
            return 'Notification' in window;
        }

        /**
         * Request permission for notifications if not yet granted
         * Returns a promise that resolves when permission state is determined
         * @returns {Promise<string>} Permission state: 'granted', 'denied', or 'default'
         */
        function requestNotificationPermission() {
            if (!checkNotificationSupport()) {
                return Promise.resolve('unsupported');
            }

            if (Notification.permission === 'granted' || Notification.permission === 'denied') {
                return Promise.resolve(Notification.permission);
            }

            // Permission not yet asked, request it
            return Notification.requestPermission();
        }

        /**
         * Create and show native browser notification
         * @private
         */
        function createAndShowNotification() {
            if (checkNotificationSupport() && Notification.permission === 'granted') {
                try {
                    new Notification('Focus Session Complete!', {
                        body: 'Your 25-minute focus session is complete.',
                        tag: 'focus-timer-completion', // Prevents duplicate notifications
                        requireInteraction: false
                    });
                } catch (error) {
                    console.error('Error creating notification:', error);
                    // Fallback to visual indicator if notification fails
                    showFallbackNotification();
                }
            }
        }

        /**
         * Show visual fallback notification indicator in DOM
         * Displays for 5 seconds then hides
         * @private
         */
        function showFallbackNotification() {
            const fallback = document.getElementById('timer-notification-fallback');
            if (fallback) {
                fallback.style.display = 'block';
                
                // Auto-hide after 5 seconds
                setTimeout(function() {
                    fallback.style.display = 'none';
                }, 5000);
            }
        }

        /**
         * Show notification when timer completes
         * Uses Notification API if available and permitted, falls back to visual indicator
         * Validates: Requirements 3.5
         */
        function showNotification() {
            if (!checkNotificationSupport()) {
                // Notification API not supported, use fallback
                showFallbackNotification();
                return;
            }

            if (Notification.permission === 'granted') {
                // Already have permission, show notification
                createAndShowNotification();
            } else if (Notification.permission === 'denied') {
                // Permission was explicitly denied, use fallback
                showFallbackNotification();
            } else {
                // Permission not yet asked - request it and show notification if granted
                requestNotificationPermission().then(function(permission) {
                    if (permission === 'granted') {
                        createAndShowNotification();
                    } else {
                        // Permission not granted, use fallback
                        showFallbackNotification();
                    }
                });
            }
        }

        /**
         * Initialize timer with 1500 seconds (25 minutes)
         */
        function init() {
            remainingSeconds = 1500;
            isRunning = false;
            timerInterval = null;
            hasNotified = false;
            updateDisplay();
        }

        /**
         * Start or resume countdown
         * Handles state transitions: stopped→running, paused→running
         * Validates: Requirements 4.1, 4.3, 3.4
         */
        function start() {
            // A completed session must be reset before starting another countdown.
            if (!isRunning && remainingSeconds > 0) {
                isRunning = true;
                hasNotified = false; // Reset notification flag when starting new session
                
                // Set up interval to decrement every second
                timerInterval = setInterval(function() {
                    // Decrement remaining seconds
                    remainingSeconds = Math.max(0, remainingSeconds - 1);
                    
                    // Update display
                    updateDisplay();
                    
                    // Check if timer reached 00:00
                    if (remainingSeconds === 0 && !hasNotified) {
                        // Mark that we've notified for this completion
                        hasNotified = true;
                        
                        // Stop the countdown
                        clearInterval(timerInterval);
                        timerInterval = null;
                        isRunning = false;
                        
                        // Show notification
                        showNotification();
                    }
                }, 1000);
            }
        }

        /**
         * Pause countdown
         * Handles state transition: running→paused
         * Validates: Requirements 4.2
         */
        function stop() {
            // Only stop if currently running
            if (isRunning) {
                isRunning = false;
                
                // Clear the interval
                if (timerInterval !== null) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
            }
        }

        /**
         * Reset timer to 25 minutes (1500 seconds)
         * Can be called from any state (stopped, running, paused)
         * Validates: Requirements 4.4, 4.5
         */
        function reset() {
            // Stop the timer if it's running
            if (isRunning) {
                isRunning = false;
                
                if (timerInterval !== null) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
            }
            
            // Reset to 1500 seconds (25 minutes)
            remainingSeconds = 1500;
            hasNotified = false;
            
            // Hide any displayed notification fallback
            const fallback = document.getElementById('timer-notification-fallback');
            if (fallback) {
                fallback.style.display = 'none';
            }
            
            // Update display to show 25:00
            updateDisplay();
        }

        /**
         * Clean up intervals
         */
        function destroy() {
            if (timerInterval !== null) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }

        // Public API
        return {
            init: init,
            start: start,
            stop: stop,
            reset: reset,
            getRemainingTime: getRemainingTime,
            formatTime: formatTime,
            destroy: destroy,
            // Expose for testing
            checkNotificationSupport: checkNotificationSupport,
            requestNotificationPermission: requestNotificationPermission,
            showNotification: showNotification
        };
    })();

    // ============================================
    // Todo Manager Module
    // ============================================
    const TodoManager = (function() {
        /**
         * Todo Manager Component
         * Manages task lifecycle including creation, editing, completion tracking, and deletion.
         * All task data is persisted to Local Storage and synchronized within 100ms
         * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5,
         *            7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4
         */

        // Internal state - private through closure
        let tasks = [];        // Array of task objects
        let editingId = null;  // ID of task currently being edited (null if none)

        /**
         * Generate unique ID for tasks
         * Format: timestamp-randomstring (e.g., "1705334400000-abc123")
         * @private
         * @returns {string} Unique identifier
         */
        function generateTaskId() {
            const timestamp = Date.now().toString();
            const random = Math.random().toString(36).substring(2, 9);
            return timestamp + '-' + random;
        }

        /**
         * Format time in MM:SS format
         * Helper for displaying time values
         * @private
         * @param {number} seconds - Number of seconds to format
         * @returns {string} Time formatted as MM:SS
         */
        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            return `${minutes}:${secs}`;
        }

        /**
         * Initialize TodoManager by loading tasks from Local Storage
         * Called on app startup to restore persisted tasks
         * Handles corrupted data gracefully by returning empty array
         * Validates: Requirements 9.1, 9.4
         */
        function init() {
            try {
                // Load tasks from Local Storage
                const storedTasks = Storage.get('dashboard_tasks');
                
                if (storedTasks === null || storedTasks === undefined) {
                    // No tasks in storage yet - start with empty array
                    tasks = [];
                } else if (Array.isArray(storedTasks)) {
                    // Valid array found - use it
                    tasks = storedTasks;
                } else {
                    // Data exists but is not an array - corrupted data
                    console.error('TodoManager init: Storage data is not an array, resetting to empty');
                    tasks = [];
                }
                
                editingId = null;
            } catch (error) {
                // Catch any unexpected errors during initialization
                console.error('TodoManager init error:', error);
                tasks = [];
                editingId = null;
            }
        }

        /**
         * Get current tasks array
         * Used by other modules and tests to read tasks without modification
         * Validates: Requirements 9.2
         * @returns {Task[]} Copy of current tasks array
         */
        function getTasks() {
            // Return a copy of the tasks array to prevent external modification
            return tasks.slice();
        }

        /**
         * Save tasks to Local Storage
         * Ensures all modifications persist within 100ms
         * @private
         */
        function saveTasks() {
            try {
                const success = Storage.set('dashboard_tasks', tasks);
                if (!success) {
                    console.warn('TodoManager saveTasks: Storage.set returned false');
                }
            } catch (error) {
                console.error('TodoManager saveTasks error:', error);
            }
        }

        /**
         * Stub for renderTasks - implemented in task 8.2
         * Called after any task modification to update DOM display
         * @private
         */
        function renderTasks() {
            // Stub implementation - fully implemented in task 8.2
            // Will generate and update the todo list DOM
        }

        // Public API
        return {
            init: init,
            getTasks: getTasks,
            // Additional methods to be implemented in subsequent tasks:
            // addTask: function(text) {...},
            // editTask: function(id, text) {...},
            // toggleComplete: function(id) {...},
            // deleteTask: function(id) {...},
            // renderTasks: function() {...}

            // Exposed for testing (internal helpers)
            _saveTasks: saveTasks,      // For testing storage synchronization
            _renderTasks: renderTasks,  // For testing rendering
            _setEditingId: function(id) { editingId = id; }, // For testing edit state
            _getEditingId: function() { return editingId; }   // For testing edit state
        };
    })();

    // ============================================
    // Quick Links Manager Module
    // ============================================
    const QuickLinksManager = (function() {
        // Quick links manager implementation will go here
        return {
            init: function() {},
            addLink: function(name, url) {},
            deleteLink: function(id) {},
            getLinks: function() {},
            renderLinks: function() {}
        };
    })();

    // ============================================
    // Utility Functions
    // ============================================
    function generateId() {
        // Generate unique ID using timestamp + random string
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // ============================================
    // Main App Initialization
    // ============================================
    function init() {
        // Initialize all modules
        Storage.init && Storage.init();
        GreetingDisplay.init();
        FocusTimer.init();
        TodoManager.init();  // Load tasks from Local Storage on startup
        QuickLinksManager.init();
        
        // Wire event handlers for timer controls
        const timerStartBtn = document.getElementById('timer-start');
        const timerStopBtn = document.getElementById('timer-stop');
        const timerResetBtn = document.getElementById('timer-reset');
        
        if (timerStartBtn) {
            timerStartBtn.addEventListener('click', function() {
                FocusTimer.start();
            });
        }
        
        if (timerStopBtn) {
            timerStopBtn.addEventListener('click', function() {
                FocusTimer.stop();
            });
        }
        
        if (timerResetBtn) {
            timerResetBtn.addEventListener('click', function() {
                FocusTimer.reset();
            });
        }
    }

    // Public API
    return {
        init: init,
        Storage: Storage,
        GreetingDisplay: GreetingDisplay,
        FocusTimer: FocusTimer,
        TodoManager: TodoManager,
        QuickLinksManager: QuickLinksManager,
        generateId: generateId
    };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
