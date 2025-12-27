Load WSC (World State Chronicler) specifications from the specs directory. If a specific file is provided as "$ARGUMENTS", load only that content. Otherwise, load all specification files.

Follow these steps:
1. Read the specs directory contents
2. Load the requested specification files:
   - WSC_design_goals_v1.0.md - High-level philosophy and goals
   - WSC_design_doc_v1.0.md - Detailed technical specification
3. Summarize the key concepts:
   - Entity hierarchy (Polity, Region, Locale, Force, Agent, Holding, Link)
   - Lens system (Grand Strategy, Regional, Locale, Scene/Tactical, Embodied)
   - Chronicle event system
   - AI integration architecture
4. Keep these specifications in context for implementation work

Key WSC concepts to remember:
- **World State Graph**: Canonical current truth (entities + relationships)
- **Chronicle**: Append-only event log
- **Lens**: Gameplay mode that expands/summarizes world state
- **AI Block**: Optional LLM integration per entity
- **Importance**: Editorial ranking scalar

Use this context when implementing new features, entities, or lenses.
