# Todo List Life Dashboard

A vanilla HTML/CSS/JavaScript dashboard with a local clock and personalized greeting, a configurable focus timer, editable tasks, quick links, and light/dark themes. Tasks, links, name, focus duration, and theme persist in the browser's Local Storage. Storage failures show a warning while controls remain usable.

The application uses the existing IIFE modules in `js/app.js`, one stylesheet in `css/style.css`, and no production dependencies, backend, build step, or credentials. Kiro requirements, design, and the implementation checklist are in `.kiro/specs/todo-list-life-dashboard/`.

Save or change your name in the greeting card, or choose Use Default Greeting to restore the time-based greeting. Apply a focus duration of 1–180 whole minutes (25 by default); applying stops and resets the current session, and Reset uses your selected duration. Use the Light/Dark toggle to change appearance. Task names must be unique regardless of case, surrounding whitespace, or completion status; editing into another task's name is also rejected.

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

## GitHub Pages

`index.html` remains at the repository root and loads `css/style.css` and `js/app.js` with relative paths. No build step is needed, and browser tests serve the site beneath `/CodingCamp-05October26-calvinsuganda/` to check project-site compatibility. The repository name and Pages URL are unchanged.

The Pages deployment source must be checked in the existing repository settings before confirming that a merge to `main` publishes the update. GitHub API/Pages access is blocked in this workspace, so that remote configuration and a live deployment cannot currently be verified. See the verification notes and the pending task 22.2.
