# Dashboard verification

Verified on 2026-10-10 in the Debian 13 x86_64 cloud workspace using Node.js 24, npm 11, and Python 3. The runtime remains vanilla HTML/CSS/JavaScript; Jest, fast-check, and Playwright are development tools only.

## Automated results

`npm test -- --runInBand`: **180 tests passed across 12 suites**. Property tests execute the actual application modules with at least 100 generated cases per property. Coverage includes greeting/date formatting, timer state transitions, task/link operations and validation, storage round trips and failures, DOM integration, repeated initialization, notification cleanup, personalized names, focus-duration preferences, theme persistence, and duplicate task feedback against stored/legacy data.

`npm run test:browser`: **125 checks passed across five browser projects**. Each project verifies 25 scenarios covering task/link lifecycles and actual reloads, keyboard interaction, URL validation, isolated new tabs, inert user text, corrupt/unavailable/full storage, timer controls and completion, performance, responsive layout, focus, contrast, control sizes, and the one-script/one-stylesheet constraints. The challenge checks add actual name/duration/theme refreshes, duplicate add/edit feedback, blocked preference storage, both palettes at desktop/mobile widths, reduced motion, and assets beneath the repository path used by GitHub Pages. Native notification permission states are controlled in tests to make granted, denied, and unsupported cases repeatable; actual platform notification delivery still needs manual confirmation.

| Project | Browser tested | Checks |
| --- | --- | --- |
| Chromium | 151.0.7922.173 | 25 passed |
| Chrome | Google Chrome 155.0.8059.39 | 25 passed |
| Edge | Microsoft Edge 155.0.4283.45 | 25 passed |
| Firefox | Playwright Firefox 157.0 (build 1555) | 25 passed |
| WebKit | Playwright WebKit 27.2 (build 2370) | 25 passed |
| Native Safari | Requires macOS, unavailable in this Linux workspace | Unrun |

These versions satisfy the tested Chrome/Firefox/Edge minimum-version requirements; older releases were not separately installed. Playwright WebKit provides engine coverage and does not verify the native Safari application.

## Performance evidence

The browser test measures initial navigation readiness, the slowest synchronous control interaction, storage-and-display updates, and a short event-loop heartbeat. It asserts the design budgets of 1,000 ms for loading, 50 ms for interaction feedback, and 100 ms for storage/display updates. The heartbeat must finish within 50 ms, and timer ticks are separately verified with a controlled browser clock.

Representative passing measurements from this workspace (milliseconds):

| Browser | Load | Slowest interaction | Storage/display | Heartbeat |
| --- | ---: | ---: | ---: | ---: |
| Chromium | 46.6 | 9.6 | 9.6 | 5.1 |
| Chrome | 88.6 | 4.6 | 3.8 | 2.7 |
| Edge | 73.1 | 5.1 | 4.6 | 3.7 |
| Firefox | 125.0 | 6.0 | 3.0 | 1.0 |
| WebKit | 21.0 | 9.0 | 9.0 | 6.0 |

These are local test measurements, not a guarantee for every device or network. Layout tests cover 1,280 px desktop and 375 px mobile widths; screenshots were also inspected. Contrast assertions check rendered foreground/background colors, including completed text and action buttons.

## Reproduce in the cloud workspace

From the checkout root:

```bash
npm install --cache /workspace/.npm-cache --package-lock=false --no-audit --no-fund
bash scripts/install-vendor-browsers.sh
bash scripts/install-browser-libraries.sh
PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright npx playwright install firefox webkit
npm test -- --runInBand
npm run test:browser
```

Browser helpers download packages using signed APT repository metadata and verified package hashes, then extract them into the workspace cache. They require Debian 13 x86_64 and existing base-system dependencies. They do not require root or modify the system package database. Cached versions are reused; remove the relevant cache deliberately when updating browsers.

`playwright.config.js` handles writable Firefox profile/cache paths and launches the pinned WebKit bundle with the locally extracted libraries. Playwright's installer may warn that the system libraries are missing because it does not inspect this local cache; the successful WebKit browser tests verify the configured launcher. The container launch settings apply only to browser tests. The static servers use ports 8765 and 8766 and are stopped by Playwright; the second serves beneath the repository directory to test project-site paths. Failed checks retain traces and screenshots under ignored test output directories.

For a subset, append a project filter, for example `npm run test:browser -- --project=firefox`. Do not run two browser commands simultaneously because they use the same server ports.

## Remaining native Safari check

Kiro tasks **16 and 17 remain in progress**. Safari 14+ cannot run in this Linux workspace. On macOS, serve the same checkout with `python3 -m http.server 8000 --bind 127.0.0.1`, open it in native Safari without extensions, and record Safari/macOS versions and the results below:

- Check the local HH:MM time, date, and appropriate greeting. Save/change a name, reject blank names, refresh to restore it, and return to the default greeting.
- Add a task by button and Enter; reject blank/whitespace input and trimmed/case-insensitive duplicates, including loaded completed tasks and duplicate edits. Edit, save, cancel, and press Escape; toggle completion and delete. Confirm keyboard access and visible focus.
- Add a named link with and without an HTTP(S) scheme, reject blanks and unsafe/invalid URLs, open it in a new tab with no opener, and delete it.
- Reload and confirm remaining tasks, completion states, and links persist. With blocked/full storage, confirm a visible warning and usable in-memory controls. Verify corrupt stored JSON recovers safely.
- Apply a valid custom duration and refresh to restore it. Invalid/blank/fractional/out-of-range input must preserve the current countdown. Start, pause, resume, and reset the timer to the selected duration. Let it complete; confirm it stops at zero, delivers a notification when permission is granted, and shows a visual fallback when permission is denied or unsupported. Reset must dismiss fallback and cancel a pending permission result.
- Toggle light/dark mode using the keyboard, refresh to restore the theme, and check narrow and desktop layouts, long text wrapping, completed-task readability, hover/focus feedback, and controls with at least 44 px hit areas.
- Record load/interaction timing and any console errors. Fix failures and rerun relevant automated tests before updating the checklist.

Only after the native Safari check passes should task 16 and the final checkpoint (17) be marked complete. No failing automated application check is waived.


## GitHub Pages and pull request status

The root `index.html` and its relative `css/style.css` / `js/app.js` URLs are unchanged in location. All five browser projects successfully served and interacted with the site beneath `/CodingCamp-05October26-calvinsuganda/`. No build, backend, framework, package dependency, repository rename, Pages URL change, or deployment workflow replacement was introduced.

GitHub API and live Pages requests return proxy `403 Forbidden`, including the Pages configuration read. Publishing `feat/dashboard-personalization` also failed with repository permission denied, and `gh pr create` returned Forbidden for the GraphQL request. No remote branch or PR was created; remote `main` remains unchanged. The existing deployment source therefore cannot be confirmed in this workspace. Task 22.2 remains pending until the source is verified and the PR is created. If Pages already deploys from `main` at the repository root, merging these static files will update that existing site; do not change its URL or source speculatively. After merge, verify the Pages deployment succeeds and check preference persistence and assets on the live site.

The full final browser run passed all 125 checks with no retries. Firefox link tests also passed three repeated runs after explicitly centering the button before a real mouse click: this headless build dropped pointer events near the viewport edge even when DOM hit-testing found the button. The tests still verify actual new tabs and `window.opener === null`; no assertions were skipped. Color transitions exclude dynamically created checkboxes to keep interaction latency within the existing budget.
