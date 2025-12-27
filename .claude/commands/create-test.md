Create comprehensive test cases for the file or module specified in "$ARGUMENTS". If no argument is provided, ask which module needs tests.

Follow these steps:
1. Analyze the source code to understand functionality
2. Identify key functions, methods, and edge cases to test
3. Create appropriate test cases using Vitest
4. Include tests for:
   - Normal operation paths
   - Edge cases and boundary conditions
   - Error handling
   - Integration with other components (when relevant)

WSC-specific test categories:

**Entity Tests:**
- Schema validation (required fields, ID format)
- AI block structure validation
- Relationship edge creation/validation

**Chronicle Tests:**
- Event emission and append-only behavior
- Event causality chain integrity
- Importance score calculations
- Temporal ordering (t_world)

**Lens Tests:**
- expand() produces valid instance state
- summarize() produces valid events
- Authority/scope rules enforced
- AI decision points fire correctly
- Fallback behavior when LLM unavailable

**World State Tests:**
- Effect functions are idempotent
- State updates are deterministic
- Snapshot consistency

**AI Integration Tests:**
- Context assembly correctness
- Prompt template rendering
- Tier routing logic
- Response caching behavior

Test file conventions:
- Place tests in `tests/` or `__tests__/` directory
- Name test files `*.test.ts` or `*.spec.ts`
- Use descriptive test names: `it('should emit battle.resolved when force wins')`
- Mock LLM calls for deterministic tests
- Use fixtures for common entity/event setups

Use extended thinking to design comprehensive test coverage before writing test code.
