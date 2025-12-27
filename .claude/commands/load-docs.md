Load documentation from the ai_docs directory. If a specific file or subdirectory is provided as "$ARGUMENTS", load only that content. Otherwise, load all documentation files.

Follow these steps:
1. Check if ai_docs directory exists
2. If a specific file or subdirectory is specified, verify it exists
3. Read the content of all relevant documentation files
4. Summarize key information about:
   - External library APIs and usage patterns
   - LLM provider documentation (Anthropic, OpenAI, etc.)
   - Game engine or rendering framework docs
   - Any other technical dependencies

For WSC specifically, look for documentation on:
- JSON schema validation libraries
- NDJSON handling
- Graph database or storage approaches
- Prompt templating systems (Handlebars, etc.)
- Testing frameworks (Vitest, etc.)

Keep this documentation in context for implementation work.
