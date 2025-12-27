Perform a comprehensive code review of the file or directory specified in "$ARGUMENTS". If no argument is provided, review the most recently modified TypeScript files.

Follow these steps:
1. Identify the files to review
2. Analyze the code for:
   - TypeScript best practices and type safety
   - Potential bugs or logic errors
   - Performance issues
   - Security concerns (especially in AI/LLM integration)
   - Missing documentation
   - Test coverage gaps
3. Check WSC-specific concerns:
   - Entity schema compliance (id format, required attrs, ai block structure)
   - Chronicle event structure (t_world, causes, importance)
   - Lens contract compliance (expand/summarize interface)
   - AI integration patterns (context assembly, tier usage, fallbacks)
   - World state immutability (events should not mutate directly)
4. Provide a detailed report with:
   - Overall assessment
   - Specific issues identified (with line numbers)
   - Recommendations for improvements
   - Code examples for suggested changes

WSC-specific guidelines:
- Entity IDs must follow `type.slug` format
- All entities should have optional `ai` block typing
- Chronicle events are append-only; never modify existing events
- Lens implementations must handle AI fallback gracefully
- World state updates must go through effect functions
- Use importance scoring consistently (0-1 range)

Use extended thinking to thoroughly analyze complex code before providing feedback.
