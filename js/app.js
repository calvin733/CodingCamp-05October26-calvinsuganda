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
                    showStorageWarning('Storage full. Please delete some items. Changes may not persist.');
                } else if (error.name === 'SecurityError') {
                    // Security error - private browsing or disabled storage
                    console.error(`Storage set error - SecurityError for key "${key}":`, error);
                    showStorageWarning('Browser storage unavailable. Data will not persist.');
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
            destroy();
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
        let fallbackTimeout = null;
        let session = 0;

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
                timerDisplay.classList.toggle('running', isRunning);
            }
        }

        /**
         * Check if browser supports Notification API
         * @returns {boolean} True if Notification API is available
         */
        function checkNotificationSupport() {
            return typeof window.Notification === 'function';
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

            // Permission requests can reject or throw when a browser blocks them.
            try {
                return Promise.resolve(Notification.requestPermission()).catch(() => 'denied');
            } catch (error) {
                return Promise.resolve('denied');
            }
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
                
                // Only the current session may hide its fallback.
                clearTimeout(fallbackTimeout);
                fallbackTimeout = setTimeout(function() {
                    fallbackTimeout = null;
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
                const currentSession = session;
                requestNotificationPermission().then(function(permission) {
                    if (currentSession !== session) return;
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
            destroy();
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
                updateDisplay();
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
                        updateDisplay();
                        
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
                updateDisplay();
            }
        }

        /**
         * Reset timer to 25 minutes (1500 seconds)
         * Can be called from any state (stopped, running, paused)
         * Validates: Requirements 4.4, 4.5
         */
        function reset() {
            session++;
            clearTimeout(fallbackTimeout);
            fallbackTimeout = null;
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
            session++;
            clearTimeout(fallbackTimeout);
            fallbackTimeout = null;
            isRunning = false;
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

        function generateTaskId() {
            return generateId();
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
                    tasks = storedTasks.filter(task => task &&
                        typeof task.id === 'string' && typeof task.text === 'string' &&
                        typeof task.completed === 'boolean' && Number.isFinite(task.createdAt));
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
            renderTasks();
            const list = document.getElementById('todo-list');
            if (list) {
                list.addEventListener('click', handleClick);
                list.addEventListener('change', handleChange);
                list.addEventListener('keydown', handleKeydown);
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
            return tasks.map(task => ({ ...task }));
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

        function addTask(text) {
            const value = typeof text === 'string' ? text.trim().slice(0, 500) : '';
            if (!value) return false;
            tasks.push({ id: generateTaskId(), text: value, completed: false, createdAt: Date.now() });
            saveTasks();
            renderTasks();
            const input = document.getElementById('todo-input');
            if (input) {
                input.value = '';
                input.focus();
            }
            return true;
        }

        function editTask(id, text) {
            const task = tasks.find(task => task.id === id);
            const value = typeof text === 'string' ? text.trim().slice(0, 500) : '';
            if (!task || !value) return false;
            task.text = value;
            editingId = null;
            saveTasks();
            renderTasks();
            return true;
        }

        function toggleComplete(id) {
            const task = tasks.find(task => task.id === id);
            if (!task) return false;
            task.completed = !task.completed;
            saveTasks();
            // Preserve the row and any active edit rather than rebuilding the list.
            const row = findRow(id);
            if (row) {
                row.querySelector('.todo-checkbox').checked = task.completed;
                const text = row.querySelector('.todo-text');
                if (text) text.classList.toggle('completed', task.completed);
            }
            return true;
        }

        function deleteTask(id) {
            if (!tasks.some(task => task.id === id)) return false;
            tasks = tasks.filter(task => task.id !== id);
            if (editingId === id) editingId = null;
            saveTasks();
            renderTasks();
            return true;
        }

        function findRow(id) {
            const list = document.getElementById('todo-list');
            return list && Array.from(list.querySelectorAll('.todo-item'))
                .find(row => row.dataset.id === id);
        }

        function renderTasks() {
            const list = document.getElementById('todo-list');
            if (!list) return;
            const fragment = document.createDocumentFragment();
            tasks.forEach(task => {
                const row = document.createElement('li');
                row.className = 'todo-item';
                row.dataset.id = task.id;
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'todo-checkbox';
                checkbox.checked = task.completed;
                checkbox.setAttribute('aria-label', 'Mark ' + task.text + ' complete');
                const checkTarget = document.createElement('label');
                checkTarget.className = 'todo-check-target';
                checkTarget.appendChild(checkbox);
                row.appendChild(checkTarget);
                if (editingId === task.id) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'todo-text-input';
                    input.maxLength = 500;
                    input.value = task.text;
                    input.setAttribute('aria-label', 'Edit task');
                    row.appendChild(input);
                    row.appendChild(makeButton('Save', 'todo-save'));
                    row.appendChild(makeButton('Cancel', 'todo-cancel'));
                } else {
                    const text = document.createElement('span');
                    text.className = 'todo-text';
                    text.classList.toggle('completed', task.completed);
                    text.textContent = task.text;
                    row.appendChild(text);
                    row.appendChild(makeButton('Edit', 'todo-edit', 'Edit ' + task.text));
                    row.appendChild(makeButton('Delete', 'todo-delete', 'Delete ' + task.text));
                }
                fragment.appendChild(row);
            });
            list.replaceChildren(fragment);
        }

        function handleClick(event) {
            const button = event.target.closest('button');
            const row = button && button.closest('.todo-item');
            if (!row || !event.currentTarget.contains(row)) return;
            const id = row.dataset.id;
            if (button.classList.contains('todo-delete')) deleteTask(id);
            else if (button.classList.contains('todo-edit')) {
                editingId = id;
                renderTasks();
                const input = findRow(id).querySelector('.todo-text-input');
                input.focus();
                input.select();
            } else if (button.classList.contains('todo-save')) {
                editTask(id, row.querySelector('.todo-text-input').value);
            } else if (button.classList.contains('todo-cancel')) {
                editingId = null;
                renderTasks();
            }
        }

        function handleChange(event) {
            if (event.target.classList.contains('todo-checkbox')) {
                const row = event.target.closest('.todo-item');
                if (row) toggleComplete(row.dataset.id);
            }
        }

        function handleKeydown(event) {
            if (!event.target.classList.contains('todo-text-input')) return;
            const id = event.target.closest('.todo-item').dataset.id;
            if (event.key === 'Enter') {
                event.preventDefault();
                editTask(id, event.target.value);
            } else if (event.key === 'Escape') {
                editingId = null;
                renderTasks();
            }
        }

        return {
            init, getTasks, addTask, editTask, toggleComplete, deleteTask, renderTasks,
            // Retain the existing test hooks for the core-state tests.
            _saveTasks: saveTasks,
            _renderTasks: renderTasks,
            _setEditingId: function(id) { editingId = id; },
            _getEditingId: function() { return editingId; }
        };
    })();

    // ============================================
    // Quick Links Manager Module
    // ============================================
    const QuickLinksManager = (function() {
        let links = [];

        function normalizeUrl(value) {
            if (typeof value !== 'string' || !value.trim()) return null;
            const input = value.trim();
            const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(input) &&
                !/^[^/:]+:[0-9]+(?:[/?#]|$)/.test(input);
            const candidate = input.startsWith('//') ? 'https:' + input :
                hasScheme ? input : 'https://' + input;
            try {
                const url = new URL(candidate);
                if (!['http:', 'https:'].includes(url.protocol) || !url.hostname ||
                    url.username || url.password) return null;
                return url.href;
            } catch (error) {
                return null;
            }
        }

        function init() {
            const stored = Storage.get('dashboard_links');
            links = Array.isArray(stored) ? stored.filter(link => link &&
                typeof link.id === 'string' && typeof link.name === 'string' &&
                link.name.trim() && Number.isFinite(link.createdAt) && normalizeUrl(link.url))
                .map(link => ({ ...link, url: normalizeUrl(link.url) })) : [];
            renderLinks();
            const list = document.getElementById('links-list');
            if (list) list.addEventListener('click', handleClick);
        }

        function getLinks() {
            return links.map(link => ({ ...link }));
        }

        function addLink(name, url) {
            const value = typeof name === 'string' ? name.trim().slice(0, 50) : '';
            if (!value || typeof url !== 'string' || !url.trim()) return false;
            const normalized = normalizeUrl(url);
            const urlInput = document.getElementById('link-url');
            if (!normalized) {
                if (urlInput) {
                    urlInput.setCustomValidity('Please enter a valid URL');
                    urlInput.reportValidity();
                }
                return false;
            }
            if (urlInput) urlInput.setCustomValidity('');
            links.push({ id: generateId(), name: value, url: normalized, createdAt: Date.now() });
            Storage.set('dashboard_links', links);
            renderLinks();
            ['link-name', 'link-url'].forEach(id => {
                const input = document.getElementById(id);
                if (input) input.value = '';
            });
            const nameInput = document.getElementById('link-name');
            if (nameInput) nameInput.focus();
            return true;
        }

        function deleteLink(id) {
            if (!links.some(link => link.id === id)) return false;
            links = links.filter(link => link.id !== id);
            Storage.set('dashboard_links', links);
            renderLinks();
            return true;
        }

        function renderLinks() {
            const list = document.getElementById('links-list');
            if (!list) return;
            const fragment = document.createDocumentFragment();
            links.forEach(link => {
                const row = document.createElement('div');
                row.className = 'link-item';
                row.dataset.id = link.id;
                row.appendChild(makeButton(link.name, 'link-button', 'Open ' + link.name + ' in a new tab'));
                row.appendChild(makeButton('×', 'link-delete', 'Delete ' + link.name));
                fragment.appendChild(row);
            });
            list.replaceChildren(fragment);
        }

        function handleClick(event) {
            const button = event.target.closest('button');
            const row = button && button.closest('.link-item');
            if (!row || !event.currentTarget.contains(row)) return;
            const link = links.find(link => link.id === row.dataset.id);
            if (!link) return;
            if (button.classList.contains('link-delete')) deleteLink(link.id);
            else if (button.classList.contains('link-button')) {
                window.open(link.url, '_blank', 'noopener,noreferrer');
            }
        }

        return { init, getLinks, addLink, deleteLink, renderLinks };
    })();

    // ============================================
    // Utility Functions
    // ============================================
    let idCounter = 0;
    function generateId() {
        // Counter also distinguishes IDs created within the same millisecond.
        return Date.now().toString() + '-' + Math.random().toString(36).slice(2, 9) +
            (++idCounter).toString(36);
    }

    function makeButton(text, className, label) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = text;
        if (label) button.setAttribute('aria-label', label);
        return button;
    }

    function showStorageWarning(message) {
        const status = document.getElementById('storage-status');
        if (status) {
            status.hidden = false;
            status.textContent = message;
        }
    }

    function addTaskFromInput() {
        const input = document.getElementById('todo-input');
        if (input) TodoManager.addTask(input.value);
    }

    function addLinkFromInputs() {
        const name = document.getElementById('link-name');
        const url = document.getElementById('link-url');
        if (name && url) QuickLinksManager.addLink(name.value, url.value);
    }

    function handleInputKey(event) {
        if (event.key !== 'Enter' || event.isComposing) return;
        event.preventDefault();
        if (event.target.id === 'todo-input') addTaskFromInput();
        else addLinkFromInputs();
    }

    function clearUrlError(event) {
        event.target.setCustomValidity('');
    }

    // Initialize modules and use stable handlers so repeated init cannot duplicate actions.
    function init() {
        if (!Storage.isAvailable()) {
            showStorageWarning('Browser storage unavailable. Data will not persist.');
        }
        GreetingDisplay.init();
        FocusTimer.init();
        TodoManager.init();
        QuickLinksManager.init();
        const clicks = {
            'timer-start': FocusTimer.start,
            'timer-stop': FocusTimer.stop,
            'timer-reset': FocusTimer.reset,
            'todo-add': addTaskFromInput,
            'link-add': addLinkFromInputs
        };
        Object.keys(clicks).forEach(id => {
            const button = document.getElementById(id);
            if (button) button.addEventListener('click', clicks[id]);
        });
        ['todo-input', 'link-name', 'link-url'].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.addEventListener('keydown', handleInputKey);
        });
        const url = document.getElementById('link-url');
        if (url) url.addEventListener('input', clearUrlError);
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
