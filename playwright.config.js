const { defineConfig } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
// This cloud machine has a system Chromium; other machines can use Playwright's build.
const chromium = process.env.CHROMIUM_EXECUTABLE_PATH ||
    (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const vendorBinary = (variable, relative) => {
    const cached = path.resolve(__dirname, '../.cache', relative);
    return process.env[variable] || (fs.existsSync(cached) ? cached : undefined);
};
const chrome = vendorBinary('CHROME_EXECUTABLE_PATH', 'google-chrome/opt/google/chrome/chrome');
const edge = vendorBinary('EDGE_EXECUTABLE_PATH', 'microsoft-edge/opt/microsoft/msedge/msedge');
const firefoxUserRoot = path.resolve(__dirname, '../.cache/firefox-user');
fs.mkdirSync(path.join(firefoxUserRoot, 'config'), { recursive: true });
fs.mkdirSync(path.join(firefoxUserRoot, 'cache'), { recursive: true });
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH ||
    path.resolve(__dirname, '../.cache/ms-playwright');
const browserLibraries = path.resolve(__dirname, '../.cache/browser-libs/usr/lib/x86_64-linux-gnu');
module.exports = defineConfig({
    testDir: './tests/browser',
    testMatch: '**/*.spec.js',
    timeout: 30000,
    retries: 0,
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:8765',
        headless: true,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    webServer: {
        command: 'python3 -m http.server 8765 --bind 127.0.0.1',
        url: 'http://127.0.0.1:8765',
        reuseExistingServer: false,
        timeout: 10000
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium', launchOptions: {
            executablePath: chromium, args: ['--no-sandbox', '--disable-dev-shm-usage']
        } } },
        { name: 'firefox', use: { browserName: 'firefox', launchOptions: { env: {
            ...process.env,
            XDG_CONFIG_HOME: path.join(firefoxUserRoot, 'config'),
            XDG_CACHE_HOME: path.join(firefoxUserRoot, 'cache'),
            MOZ_DISABLE_CONTENT_SANDBOX: '1'
        } } } },
        { name: 'webkit', use: { browserName: 'webkit', launchOptions: {
            // The stock Linux wrapper replaces LD_LIBRARY_PATH and cannot use local deps.
            executablePath: process.platform === 'linux' && fs.existsSync(browserLibraries)
                ? path.resolve(__dirname, 'scripts/run-webkit.sh') : undefined
        } } },
        { name: 'chrome', use: { browserName: 'chromium', channel: 'chrome', launchOptions: {
            executablePath: chrome, args: ['--no-sandbox', '--disable-dev-shm-usage']
        } } },
        { name: 'edge', use: { browserName: 'chromium', channel: 'msedge', launchOptions: {
            executablePath: edge, args: ['--no-sandbox', '--disable-dev-shm-usage']
        } } }
    ]
});
