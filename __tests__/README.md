# Storage Module Property-Based Tests

## Overview

This directory contains property-based tests for the Storage module of the Todo List Life Dashboard application. The tests validate that data can be saved to and retrieved from Local Storage with perfect fidelity.

## Tests Implemented

### Property 10: Task Storage Round-Trip
**Validates: Requirements 5.3, 6.3, 7.4, 8.2, 9.2**

Tests that any task object or array of task objects can be:
1. Serialized and saved to Local Storage
2. Retrieved from Local Storage
3. Deserialized with all properties intact (id, text, completed, createdAt)

Two variants:
- **Property 10a**: Single task object round-trip
- **Property 10b**: Task array round-trip

### Property 15: Link Storage Round-Trip
**Validates: Requirements 10.3, 12.2, 13.2**

Tests that any link object or array of link objects can be:
1. Serialized and saved to Local Storage
2. Retrieved from Local Storage
3. Deserialized with all properties intact (id, name, url, createdAt)

Two variants:
- **Property 15a**: Single link object round-trip
- **Property 15b**: Link array round-trip

## Running the Tests

### Jest Tests (Recommended)

Run from the repository root:

```bash
npm test -- --runInBand
```

To run just the storage properties and error-handling checks:

```bash
npm test -- --runInBand --runTestsByPath __tests__/storage-properties.test.js
```

Jest loads the actual browser application through `test-utils/setup.js` and uses jsdom and fake timers. Storage round-trip properties use fast-check with 100 runs each. The suite also checks corrupt data, quota/security errors, availability probes, and preservation of unrelated storage. Greeting formatting properties exercise the actual module in `tests/properties/time-formatting.test.js`; greeting DOM updates are checked in `__tests__/greeting-properties.test.js`.

The full validation completed with 12 suites and 180 tests passing. This includes task creation/editing/completion/deletion, quick-link validation/rendering/deletion, actual DOM event wiring, persistence, and asynchronous notification cleanup. `dashboard-challenges.test.js` adds name and theme preferences, custom-duration state transitions, duplicate feedback, legacy data preservation, and preference storage failures. Task/link operation properties and the new duplicate/duration properties run at least 100 generated cases each.

The Playwright workflow is separate from Jest:

```bash
npm run test:browser
```

It runs 25 checks in each of five browser projects (125 checks total), including both theme palettes at desktop/mobile widths and the GitHub Pages project path. Browser installation instructions, recorded results, performance evidence, and the pending native Safari validation are documented in [`docs/verification.md`](../docs/verification.md).

### Browser-Based Tests (Optional)

1. Open `storage-properties.test.html` in a modern web browser (Chrome, Firefox, Edge, Safari)
2. Click "Run All Property Tests" button
3. View results in the browser

The browser-based tests use the fast-check library loaded via CDN and run 100 iterations per property.

**Features:**
- Visual test results with pass/fail indicators
- Detailed counterexamples when properties fail
- Test statistics (total, passed, failed)
- Ability to run specific test groups (tasks only, links only)

The legacy HTML runners are separate from the verified Jest and Playwright workflows. The JavaScript test files run under Jest rather than directly with `node`.

## Test Configuration

- **Iterations per property**: 100 (minimum as specified in design document)
- **Test framework**: fast-check (property-based testing)
- **Storage keys tested**: `dashboard_tasks`, `dashboard_links`, and `dashboard_timer_state`

## Data Generators

The tests use generators for:
- **Task objects**: Random id, Unicode text (0-500 chars), completed (boolean), createdAt (timestamp)
- **Link objects**: Random id, Unicode name (0-50 chars), url (valid web URL), createdAt (timestamp)
- **Arrays**: Random length (0-50 items) of tasks or links

## Expected Results

All four property tests should pass, confirming:
- ✅ Single task objects maintain integrity through storage round-trip
- ✅ Task arrays maintain integrity through storage round-trip
- ✅ Single link objects maintain integrity through storage round-trip
- ✅ Link arrays maintain integrity through storage round-trip

## Why Property-Based Testing?

Property-based testing validates that the storage layer works correctly across a wide range of inputs, not just specific examples. By testing 100+ randomly generated cases per property, we gain high confidence that:

1. Serialization/deserialization is bijective (reversible without loss)
2. All data types (strings, booleans, numbers) are handled correctly
3. Special characters and edge cases don't break the storage
4. Arrays of varying sizes work consistently

This approach is superior to example-based testing for verifying data persistence properties.
