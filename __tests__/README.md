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

### Browser-Based Tests (Recommended)

1. Open `storage-properties.test.html` in a modern web browser (Chrome, Firefox, Edge, Safari)
2. Click "Run All Property Tests" button
3. View results in the browser

The browser-based tests use the fast-check library loaded via CDN and run 100 iterations per property.

**Features:**
- Visual test results with pass/fail indicators
- Detailed counterexamples when properties fail
- Test statistics (total, passed, failed)
- Ability to run specific test groups (tasks only, links only)

### Node.js Tests (Alternative)

If Node.js is available:

```bash
node __tests__/storage-properties.test.js
```

This runs the same tests using a simple mock implementation of the property-based testing framework.

## Test Configuration

- **Iterations per property**: 100 (minimum as specified in design document)
- **Test framework**: fast-check (property-based testing)
- **Storage keys tested**: `dashboard_tasks`, `dashboard_links`, and generic test keys

## Data Generators

The tests use generators for:
- **Task objects**: Random id, text (1-500 chars), completed (boolean), createdAt (timestamp)
- **Link objects**: Random id, name (1-50 chars), url (valid web URL), createdAt (timestamp)
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
