const fs = require('fs');
const path = require('path');

beforeAll(() => {
    // Browser scripts do not export a CommonJS App; keep production code unchanged.
    const source = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
    global.App = new Function(source + '\nreturn App;')();
});

beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
});

afterEach(() => {
    App.FocusTimer.destroy();
    App.GreetingDisplay.destroy();
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = '';
});
