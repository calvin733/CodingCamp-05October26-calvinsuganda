# Todo List Life Dashboard

A vanilla HTML/CSS/JavaScript dashboard with a local clock and greeting, a 25-minute focus timer, editable tasks, and quick links. Tasks and links persist in the browser's Local Storage. Storage failures show a warning while controls remain usable.

The application uses the existing IIFE modules in `js/app.js`, one stylesheet in `css/style.css`, and no production dependencies, backend, build step, or credentials. Kiro requirements, design, and the implementation checklist are in `.kiro/specs/todo-list-life-dashboard/`.

## Run

From the repository root, serve the files with Python 3:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

## Test

Install the development dependencies with Node.js and npm:

```bash
npm install --package-lock=false --no-audit --no-fund
npm test -- --runInBand
```

For the Debian 13 x86_64 cloud environment, prepare cached browser binaries and libraries without a system installation:

```bash
bash scripts/install-vendor-browsers.sh
bash scripts/install-browser-libraries.sh
PLAYWRIGHT_BROWSERS_PATH="$(dirname "$PWD")/.cache/ms-playwright" npx playwright install firefox webkit
npm run test:browser
```

The browser command starts its own static server and runs Chromium, Firefox, WebKit, Google Chrome, and Microsoft Edge. This environment supplies system Chromium; on another machine install it with `npx playwright install chromium` using the same `PLAYWRIGHT_BROWSERS_PATH`. On other operating systems, use Playwright's normal browser/dependency installation and installed Chrome/Edge channels instead of the Debian helpers.

See [verification notes](docs/verification.md) for results and the native Safari check that remains required before Kiro tasks 16 and 17 can be completed.
