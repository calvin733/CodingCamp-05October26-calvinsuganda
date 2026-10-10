# Property-Based Test Execution Guide

## Task 2.2: Write property tests for Storage module

This task implements property-based tests for the Storage module as specified in the design document.

## Test Files Created

### 1. `storage-properties.test.html` (PRIMARY TEST FILE)
A browser-based test runner using fast-check library loaded from CDN.

**To execute:**
1. Open the file in any modern web browser
2. Click "Run All Property Tests"
3. View detailed results with pass/fail status

### 2. `storage-properties.test.js`
A Node.js compatible version using custom property test framework (mock implementation).

**To execute (if Node.js is available):**
```bash
node __tests__/storage-properties.test.js
```

## Properties Tested

### Property 10: Task Storage Round-Trip
**Validates:** Requirements 5.3, 6.3, 7.4, 8.2, 9.2

**Description:** For any task or array of tasks, saving to Local Storage and then retrieving SHALL produce a value that is deeply equal to the original.

**Test Variants:**
- **10a**: Single task object round-trip (100 iterations)
- **10b**: Task array round-trip (100 iterations)

**Test Logic:**
```javascript
For each randomly generated task:
  1. Save task to Local Storage using Storage.set()
  2. Retrieve task using Storage.get()
  3. Verify deep equality:
     - id matches original
     - text matches original
     - completed matches original
     - createdAt matches original
  4. Clean up test data
```

### Property 15: Link Storage Round-Trip
**Validates:** Requirements 10.3, 12.2, 13.2

**Description:** For any link or array of links, saving to Local Storage and then retrieving SHALL produce a value that is deeply equal to the original.

**Test Variants:**
- **15a**: Single link object round-trip (100 iterations)
- **15b**: Link array round-trip (100 iterations)

**Test Logic:**
```javascript
For each randomly generated link:
  1. Save link to Local Storage using Storage.set()
  2. Retrieve link using Storage.get()
  3. Verify deep equality:
     - id matches original
     - name matches original
     - url matches original
     - createdAt matches original
  4. Clean up test data
```

## Test Data Generators

### Task Generator
Generates random task objects with:
- `id`: Random string (1-50 characters)
- `text`: Random string (1-500 characters)
- `completed`: Random boolean
- `createdAt`: Random integer timestamp (0 to current time + 1000000)

### Link Generator
Generates random link objects with:
- `id`: Random string (1-50 characters)
- `name`: Random string (1-50 characters)
- `url`: Random valid web URL
- `createdAt`: Random integer timestamp (0 to current time + 1000000)

### Array Generators
- **Task arrays**: 0-50 random tasks
- **Link arrays**: 0-50 random links

## Expected Results

All tests should PASS, demonstrating:

✅ **Property 10a PASS**: Single task objects can be saved and retrieved with perfect fidelity
✅ **Property 10b PASS**: Task arrays can be saved and retrieved with perfect fidelity
✅ **Property 15a PASS**: Single link objects can be saved and retrieved with perfect fidelity
✅ **Property 15b PASS**: Link array can be saved and retrieved with perfect fidelity

## Success Criteria

- All 4 property tests pass 100 iterations each
- No counterexamples found
- Total of 400 test cases executed successfully
- Storage module correctly handles:
  - JSON serialization/deserialization
  - All data types (string, boolean, number)
  - Special characters in strings
  - Empty arrays
  - Large arrays
  - Unicode characters

## Testing Framework

**Primary**: fast-check v3.15.0 (loaded via CDN in browser tests)
**Fallback**: Custom property-based testing framework (for Node.js tests)

Both implementations run 100 iterations per property as specified in the design document.

## Integration with Existing Tests

These property-based tests complement the existing example-based tests in:
- `test-storage.html`
- `test-storage.js`

While example-based tests verify specific scenarios, property-based tests provide comprehensive coverage across random inputs.

## How to Verify Task Completion

1. **Open `storage-properties.test.html` in a browser**
2. **Click "Run All Property Tests"**
3. **Verify all 4 tests show ✓ PASS**
4. **Check statistics show**:
   - Total: 4
   - Passed: 4
   - Failed: 0

## Screenshot of Expected Output

When tests pass, you should see:
```
✓ Property 10: Task Storage Round-Trip (Single Task)
  Validates: Requirements 5.3, 6.3, 7.4, 8.2, 9.2
  Passed with 100 runs. All tasks can be saved and retrieved with perfect fidelity.

✓ Property 10: Task Storage Round-Trip (Task Array)
  Validates: Requirements 5.3, 6.3, 7.4, 8.2, 9.2
  Passed with 100 runs. All task arrays can be saved and retrieved with perfect fidelity.

✓ Property 15: Link Storage Round-Trip (Single Link)
  Validates: Requirements 10.3, 12.2, 13.2
  Passed with 100 runs. All links can be saved and retrieved with perfect fidelity.

✓ Property 15: Link Storage Round-Trip (Link Array)
  Validates: Requirements 10.3, 12.2, 13.2
  Passed with 100 runs. All link arrays can be saved and retrieved with perfect fidelity.

Test Statistics:
Total: 4
Passed: 4
Failed: 0
```

## Troubleshooting

**Issue**: fast-check library fails to load
**Solution**: Check internet connection. The CDN URL is https://cdn.jsdelivr.net/npm/fast-check@3.15.0/lib/bundle.js

**Issue**: Tests fail with counterexamples
**Solution**: Review the Storage module implementation in `js/app.js`. The counterexample will show which input caused the failure.

**Issue**: Cannot run Node.js version
**Solution**: Use the browser-based version (`storage-properties.test.html`) instead. It's the primary test file.

## Task Completion Checklist

- [x] Created property test for single task round-trip (Property 10a)
- [x] Created property test for task array round-trip (Property 10b)
- [x] Created property test for single link round-trip (Property 15a)
- [x] Created property test for link array round-trip (Property 15b)
- [x] Each test runs minimum 100 iterations
- [x] Tests use fast-check library
- [x] Tests validate requirements 5.3, 6.3, 7.4, 8.2, 9.2 (tasks)
- [x] Tests validate requirements 10.3, 12.2, 13.2 (links)
- [x] Created browser-based test runner
- [x] Created Node.js compatible version
- [x] Documented test execution process
- [x] Verified tests can be executed

## Next Steps

After verifying tests pass:
1. Mark task 2.2 as complete in tasks.md
2. Proceed to task 3.1 (GreetingDisplay module)
3. Continue with remaining implementation tasks
