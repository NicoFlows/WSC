# WSC Scenarios Skill

Validate and manage WSC scenario templates.

## Scripts

### validate.ts
Validate a scenario for completeness and consistency.

```bash
# Validate a specific scenario
npx tsx .claude/skills/wsc-scenarios/scripts/validate.ts --scenario vega_conflict

# Verbose output with info
npx tsx .claude/skills/wsc-scenarios/scripts/validate.ts --scenario vega_conflict --verbose

# List all scenarios
npx tsx .claude/skills/wsc-scenarios/scripts/validate.ts --list
```

**Exit Codes:**
- 0: Scenario is valid
- 1: Scenario has errors

**Checks Performed:**
1. **Required Components**
   - At least 2 polities
   - At least 1 region
   - scenario.json exists and is valid

2. **Reference Integrity**
   - polity_id references exist
   - region_id references exist
   - locale_id references exist
   - affiliation references exist

3. **Location Hierarchy**
   - Parent location references exist
   - Child location references exist
   - entity_id references exist

4. **Victory Conditions**
   - At least 2 conditions defined
   - Entity references in conditions are valid

## Templates

Genre templates are available in `src/scenarios/_templates/`:

- `sci-fi.json` - Space opera, galactic conflict
- `fantasy.json` - High fantasy, kingdoms and magic
- `post-apocalyptic.json` - Survival in ruined world

Templates use `{{placeholder}}` syntax for customization.

## Scenario Structure

```
src/scenarios/<scenario_id>/
├── scenario.json          # Core metadata (REQUIRED)
├── entities/              # Starting entities
│   ├── polity.*.json      # At least 2 (REQUIRED)
│   ├── region.*.json      # At least 1 (REQUIRED)
│   ├── presence.*.json    # Polity-region control
│   ├── force.*.json       # Military units
│   ├── agent.*.json       # Characters
│   ├── locale.*.json      # Locations
│   └── holding.*.json     # Assets
├── locations/             # Spatial hierarchy
│   └── *.json
├── rules/                 # Agent-specific rules
│   └── *.json
└── events/                # Seed chronicle events
    └── *.json
```

## Related

- See `.claude/agents/scenario-builder.md` for guided scenario creation
- See `src/examples/` for complete entity examples
