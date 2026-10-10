# Manual Testing Guide - Task 4.3: Timer Completion Notification

## Overview
This guide explains how to manually test the timer completion notification functionality in your browser.

## Quick Start

1. Open `index.html` in your browser
2. Navigate to the Focus Timer section
3. Click "Start" button
4. Wait 25 minutes OR use browser DevTools to speed up testing (see below)

## Testing Scenarios

### Scenario 1: Native Notification (Permission Granted)

**Prerequisites**:
- Browser that supports Notification API (Chrome, Firefox, Edge, Safari)
- Permission for notifications allowed

**Steps**:
1. Open the dashboard
2. Click "Start" on the Focus Timer
3. Wait for timer to countdown to 00:00
4. **Expected Result**: Native browser notification appears with title "Focus Session Complete!" and message about 25-minute session

**How to Check Permission State**:
- Open browser DevTools Console (F12)
- Type: `Notification.permission`
- Should show: `"granted"`

### Scenario 2: Visual Fallback (Permission Denied)

**Prerequisites**:
- Browser that supports Notification API
- Permission for notifications DENIED

**Steps**:
1. Open the dashboard
2. In DevTools Console, set permission to denied:
   ```javascript
   Object.defineProperty(window.Notification, 'permission', {
       value: 'denied',
       writable: false
   });
   ```
3. Click "Start" on Focus Timer
4. Wait for timer to countdown to 00:00
5. **Expected Result**: Yellow notification box slides down from timer area with message "Focus Session Complete!"

**Visual Appearance**:
- Yellow background (#fff3cd)
- Dark brown text (#856404)
- Contains heading "Focus Session Complete!" and message about 25-minute session
- Auto-hides after 5 seconds
- Slides down animation on appearance

### Scenario 3: Visual Fallback (Notification API Unavailable)

**Prerequisites**:
- Browser environment without Notification API OR you simulate unavailability

**Steps**:
1. Open DevTools Console
2. Run this to simulate unavailable API:
   ```javascript
   delete window.Notification;
   ```
3. Click "Start" on Focus Timer
4. Wait for timer to countdown to 00:00
5. **Expected Result**: Same yellow visual fallback appears as Scenario 2

### Scenario 4: Speed Up Testing (DevTools Method)

**Steps**:
1. Open DevTools Console (F12)
2. Find the timer seconds. In DevTools, you can modify the app's internal state:
   ```javascript
   // Manually trigger timer completion
   App.FocusTimer.start();
   // Then after a few seconds:
   setInterval(() => {
       const remainingSeconds = App.FocusTimer.getRemainingTime();
       console.log('Timer:', App.FocusTimer.formatTime(remainingSeconds));
   }, 1000);
   ```

3. Alternative: Skip ahead by re-initializing with fewer seconds
   - Edit `js/app.js` line with `remainingSeconds = 1500;`
   - Change to `remainingSeconds = 3;` (for 3-second timer)
   - Refresh page
   - Click Start
   - Wait 3 seconds for notification
   - Remember to change back before committing!

### Scenario 5: Reset Clears Fallback

**Steps**:
1. Trigger timer completion (notification/fallback appears)
2. Click "Reset" button
3. **Expected Result**: Fallback notification (if shown) immediately disappears, timer shows 25:00

### Scenario 6: Multiple Completions

**Steps**:
1. Start timer, wait for completion (notification appears)
2. Click "Reset" 
3. Click "Start" again
4. Wait for completion again
5. **Expected Result**: Notification appears again (not just once)
6. This verifies `hasNotified` flag resets correctly

### Scenario 7: Stop and Resume (No Duplicate Notifications)

**Steps**:
1. Start timer
2. After a few seconds, click "Stop" to pause
3. Click "Start" to resume
4. Wait for timer to complete
5. **Expected Result**: Notification appears exactly once when timer reaches 00:00

### Scenario 8: Permission Request Dialog

**Steps** (First visit only):
1. Open dashboard in a fresh incognito/private window
2. Start timer and wait for completion
3. **Expected Result**: Browser shows permission request dialog
4. Click "Allow" to grant permission
5. Notification should appear
6. OR click "Block" to deny permission
7. Fallback should appear instead

## Automated Test Page

For comprehensive testing, use the provided test page:

1. Navigate to `/__tests__/timer-notification.test.html`
2. This page includes:
   - **Test 1**: Check Notification API support
   - **Test 2**: Verify timer and fallback elements exist
   - **Test 3**: Request notification permission
   - **Test 4**: 3-second timer simulation for quick testing
   - **Test 5**: Manually show/hide fallback
   - **Test 6**: Test auto-hide duration (5 seconds)
   - **Test 7**: Test reset clears fallback
   - **Live Test Log**: Real-time log of all test actions

### Using the Test Page

1. Open the test HTML file
2. Run individual tests using buttons
3. Check results in status areas
4. View detailed log at bottom

Example flow:
1. Click "Check Notification Support" → See if API available
2. Click "Check Permission State" → See current permission
3. Click "Start 3-Second Timer" → Countdown starts
4. Wait 3 seconds → Timer completion triggers
5. Notification appears (native or fallback)
6. Auto-hides after 5 seconds (for fallback)

## Browser-Specific Notes

### Chrome
- Supports Notification API on desktop and Android
- Permission persists across sessions
- Notifications show as system notifications on desktop
- Test: Use the test page for reliable testing

### Firefox
- Supports Notification API on desktop
- Shows permission prompt on first notification attempt
- Notifications appear in system notification area
- Can test permission denied state in Settings

### Edge
- Supports Notification API
- Behavior similar to Chrome
- Uses Windows notification system

### Safari
- Supports Notification API on macOS 10.14+
- Requires macOS Ventura (13) for best support
- Shows macOS-style notifications
- Note: Some older versions have limited support

### Mobile Browsers
- Chrome Android: Supports notifications
- Firefox Android: Supports notifications
- Safari iOS: Limited notification support
- Samsung Internet: Supports notifications

## Debugging Tips

### Check Notification State in Console

```javascript
// Check if API available
'Notification' in window  // true/false

// Check current permission
Notification.permission  // 'granted', 'denied', or 'default'

// Request permission (returns Promise)
Notification.requestPermission()

// Get timer state
App.FocusTimer.getRemainingTime()  // Remaining seconds

// Get formatted timer display
App.FocusTimer.formatTime(1500)  // Returns "25:00"
```

### Manually Trigger Notification

```javascript
// Start the timer
App.FocusTimer.start();

// Check every second
setInterval(() => {
    console.log(
        'Time remaining:',
        App.FocusTimer.formatTime(App.FocusTimer.getRemainingTime())
    );
}, 1000);
```

### Check Fallback Visibility

```javascript
// Is fallback visible?
document.getElementById('timer-notification-fallback').style.display

// Manually show fallback
document.getElementById('timer-notification-fallback').style.display = 'block';

// Manually hide fallback
document.getElementById('timer-notification-fallback').style.display = 'none';
```

## Troubleshooting

### Notification Doesn't Appear

1. **Check API support**: `'Notification' in window`
2. **Check permission**: `Notification.permission`
3. **Check browser notifications disabled**: Check browser settings
4. **Check system notifications**: Check OS notification settings
5. **Check tab/window focus**: Some browsers suppress notifications for focused tabs
6. **Check muted notifications**: Browser may have muted notifications for this site

### Fallback Doesn't Appear

1. **Check element exists**: Use DevTools to inspect `#timer-notification-fallback`
2. **Check CSS loaded**: Check if `style.css` is loaded (inspect in DevTools)
3. **Check display property**: 
   ```javascript
   document.getElementById('timer-notification-fallback').style.display
   ```
4. **Check parent visibility**: Ensure parent `.timer-section` is visible

### Timer Doesn't Complete

1. **Check timer is running**: Click "Start" button
2. **Check remaining time**: `App.FocusTimer.getRemainingTime()`
3. **Check interval is set**: Timer should tick down once per second
4. **Use short timer for testing**: Modify `remainingSeconds` to 3 for 3-second test

### Multiple Notifications Appear

1. **This should NOT happen**: `hasNotified` flag prevents this
2. **Check flag is working**:
   ```javascript
   // After timer completes, check flag was set
   // (This is internal, not exposed in public API)
   ```
3. **Expected**: Only ONE notification per completion

## What Should NOT Happen

- ✗ App crashes or errors appear in console
- ✗ Multiple notifications appear for single completion
- ✗ Notification appears while timer is running (only at 00:00)
- ✗ Fallback appears if native notification works
- ✗ Fallback doesn't disappear after 5 seconds
- ✗ Reset button doesn't clear fallback
- ✗ New timer session after reset can't trigger notification

## Performance Expectations

- ✓ Timer updates display every second
- ✓ Notification appears within 100ms of timer reaching 00:00
- ✓ Fallback appears/disappears smoothly
- ✓ No memory leaks (intervals properly cleared)
- ✓ No UI freezing during normal operation

## Files to Reference

- `index.html` - Contains notification fallback element
- `css/style.css` - Contains fallback styling
- `js/app.js` - FocusTimer module with notification code
- `__tests__/timer-notification.test.html` - Interactive test page
- `__tests__/timer-notification.test.js` - Unit tests

## Next Steps After Testing

1. Once notifications work correctly, proceed to next task (4.4)
2. If issues found, check debugging tips above
3. Verify all requirements from spec are met:
   - ✓ 3.4: Timer stops counting at 00:00
   - ✓ 3.5: Timer provides notification when complete
