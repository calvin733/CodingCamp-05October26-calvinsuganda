/** Timer completion checks for checkpoint 5.
 * Validates: Requirements 3.4, 3.5, 4.4 and 4.5.
 */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

describe('Focus Timer - Notification Tests', () => {
    let originalNotification;

    beforeEach(() => {
        document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
        originalNotification = Object.getOwnPropertyDescriptor(window, 'Notification');
        delete window.Notification;
        App.FocusTimer.init();
    });

    afterEach(() => {
        if (originalNotification) {
            Object.defineProperty(window, 'Notification', originalNotification);
        } else {
            delete window.Notification;
        }
    });

    function mockNotification(permission) {
        const notification = jest.fn();
        notification.permission = permission;
        notification.requestPermission = jest.fn().mockResolvedValue('granted');
        window.Notification = notification;
        return notification;
    }

    function completeTimer() {
        App.FocusTimer.start();
        jest.advanceTimersByTime(1500 * 1000);
        expect(App.FocusTimer.getRemainingTime()).toBe(0);
        expect(document.getElementById('timer-display').textContent).toBe('00:00');
    }

    test('detects the presence and absence of Notification API', () => {
        expect(App.FocusTimer.checkNotificationSupport()).toBe(false);
        mockNotification('default');
        expect(App.FocusTimer.checkNotificationSupport()).toBe(true);
    });

    test('the actual page has a hidden fallback with completion content', () => {
        const fallback = document.getElementById('timer-notification-fallback');
        expect(fallback.style.display).toBe('none');
        expect(fallback.querySelector('h3').textContent).toBe('Focus Session Complete!');
        expect(fallback.querySelector('p').textContent).toContain('25-minute');
    });

    test.each(['granted', 'denied'])('reuses %s permission without another prompt', async permission => {
        const notification = mockNotification(permission);
        await expect(App.FocusTimer.requestNotificationPermission()).resolves.toBe(permission);
        expect(notification.requestPermission).not.toHaveBeenCalled();
    });

    test('permission checks report unsupported browsers', async () => {
        await expect(App.FocusTimer.requestNotificationPermission()).resolves.toBe('unsupported');
    });

    test('completion sends the specified native notification', () => {
        const notification = mockNotification('granted');
        completeTimer();
        expect(notification).toHaveBeenCalledTimes(1);
        expect(notification).toHaveBeenCalledWith('Focus Session Complete!', {
            body: 'Your 25-minute focus session is complete.',
            tag: 'focus-timer-completion',
            requireInteraction: false
        });
        expect(document.getElementById('timer-notification-fallback').style.display).toBe('none');
        expect(jest.getTimerCount()).toBe(0);
    });

    test('starting a completed timer does not notify again before reset', () => {
        const notification = mockNotification('granted');
        completeTimer();
        App.FocusTimer.start();
        App.FocusTimer.start();
        jest.advanceTimersByTime(10000);
        expect(notification).toHaveBeenCalledTimes(1);
        expect(App.FocusTimer.getRemainingTime()).toBe(0);
        expect(jest.getTimerCount()).toBe(0);
    });

    test.each(['unsupported', 'denied'])('completion uses visual fallback when %s', permission => {
        const notification = permission === 'denied' ? mockNotification('denied') : null;
        completeTimer();
        const fallback = document.getElementById('timer-notification-fallback');
        expect(fallback.style.display).toBe('block');
        if (notification) expect(notification).not.toHaveBeenCalled();
        jest.advanceTimersByTime(5000);
        expect(fallback.style.display).toBe('none');
        expect(App.FocusTimer.getRemainingTime()).toBe(0);
        expect(jest.getTimerCount()).toBe(0);
    });

    test.each(['granted', 'denied', 'default'])('handles an initial permission response of %s', async response => {
        const notification = mockNotification('default');
        notification.requestPermission.mockImplementation(async () => {
            // Browsers update permission when resolving the prompt.
            notification.permission = response;
            return response;
        });
        completeTimer();
        await jest.advanceTimersByTimeAsync(0);
        expect(notification.requestPermission).toHaveBeenCalledTimes(1);
        expect(notification).toHaveBeenCalledTimes(response === 'granted' ? 1 : 0);
        expect(document.getElementById('timer-notification-fallback').style.display)
            .toBe(response === 'granted' ? 'none' : 'block');
    });

    test('falls back if native notification construction fails', () => {
        const notification = mockNotification('granted');
        notification.mockImplementation(() => { throw new Error('Unavailable'); });
        jest.spyOn(console, 'error').mockImplementation(() => {});
        completeTimer();
        expect(document.getElementById('timer-notification-fallback').style.display).toBe('block');
        expect(console.error).toHaveBeenCalled();
    });

    test('reset hides the visual fallback and restores 25:00', () => {
        completeTimer();
        App.FocusTimer.reset();
        expect(document.getElementById('timer-notification-fallback').style.display).toBe('none');
        expect(document.getElementById('timer-display').textContent).toBe('25:00');
        jest.advanceTimersByTime(10000);
        expect(App.FocusTimer.getRemainingTime()).toBe(1500);
    });

    test('a new session can notify again after reset', () => {
        const notification = mockNotification('granted');
        completeTimer();
        App.FocusTimer.reset();
        completeTimer();
        expect(notification).toHaveBeenCalledTimes(2);
    });

    test.each(['reject', 'throw'])('a permission prompt that can %s falls back safely', async failure => {
        const notification = mockNotification('default');
        notification.requestPermission.mockImplementation(() => {
            if (failure === 'throw') throw new Error('Blocked prompt');
            return Promise.reject(new Error('Blocked prompt'));
        });
        completeTimer();
        await jest.advanceTimersByTimeAsync(0);
        expect(notification).not.toHaveBeenCalled();
        expect(document.getElementById('timer-notification-fallback').style.display).toBe('block');
    });

    test('a permission prompt resolving after reset cannot notify the next session', async () => {
        const notification = mockNotification('default');
        let resolvePermission;
        notification.requestPermission.mockReturnValue(new Promise(resolve => { resolvePermission = resolve; }));
        completeTimer();
        App.FocusTimer.reset();
        notification.permission = 'granted';
        resolvePermission('granted');
        await jest.advanceTimersByTimeAsync(0);
        expect(notification).not.toHaveBeenCalled();
        expect(document.getElementById('timer-notification-fallback').style.display).toBe('none');
    });

    test('reset and destroy cancel fallback cleanup timers', () => {
        completeTimer();
        expect(jest.getTimerCount()).toBe(1);
        App.FocusTimer.reset();
        expect(jest.getTimerCount()).toBe(0);
        App.FocusTimer.showNotification();
        expect(jest.getTimerCount()).toBe(1);
        App.FocusTimer.destroy();
        expect(jest.getTimerCount()).toBe(0);
    });
});
