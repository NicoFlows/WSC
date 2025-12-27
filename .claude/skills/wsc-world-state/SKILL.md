---
name: wsc-world-state
description: Initialize and manage WSC world state. Use when creating a new world, loading world state, advancing simulation ticks, or checking world status.
allowed-tools: Read, Write, Bash, Glob
---

# WSC World State Management

Manage the canonical world state including initialization, tick advancement, and status checking.

## World Structure

```
src/world/
├── state.json          # World metadata (tick, settings)
├── chronicle.ndjson    # Append-only event log
└── entities/           # Entity JSON files
    ├── polity.*.json
    ├── agent.*.json
    └── ...
```

## Commands

### Initialize World

```bash
# Initialize from examples
npx tsx .claude/skills/wsc-world-state/scripts/init.ts

# Initialize empty world
npx tsx .claude/skills/wsc-world-state/scripts/init.ts --empty

# Initialize with custom name
npx tsx .claude/skills/wsc-world-state/scripts/init.ts --name "My Campaign" --genre sci-fi

# Force overwrite existing world
npx tsx .claude/skills/wsc-world-state/scripts/init.ts --force
```

### Check World Status

```bash
npx tsx .claude/skills/wsc-world-state/scripts/status.ts
```

Shows:
- Current tick
- Entity counts by type
- Recent events
- World settings

### Advance Tick

```bash
# Advance by 1 tick
npx tsx .claude/skills/wsc-world-state/scripts/tick.ts

# Advance by N ticks
npx tsx .claude/skills/wsc-world-state/scripts/tick.ts --count 5

# Advance to specific tick
npx tsx .claude/skills/wsc-world-state/scripts/tick.ts --to 1050
```

### Reset World

```bash
# Reset to initial state (keeps settings)
npx tsx .claude/skills/wsc-world-state/scripts/init.ts --reset

# Full reset (removes everything)
npx tsx .claude/skills/wsc-world-state/scripts/init.ts --force
```

## State File Format

```json
{
  "tick": 1000,
  "last_event_id": 10500,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T12:30:00Z",
  "settings": {
    "name": "Vega Conflict",
    "genre": "sci-fi",
    "tick_unit": "day"
  }
}
```

## Tick Semantics

The `tick` value represents world time. Its meaning depends on the genre:

| Genre | Tick Unit | Example |
|-------|-----------|---------|
| Galactic | Days | tick 1000 = Day 1000 |
| Continental | Seasons | tick 100 = 25th year |
| City | Weeks | tick 52 = 1 year |
| Scene | Minutes | tick 60 = 1 hour |

## Integration with Agents

Agents read world state to understand context and emit events that modify it:

1. Orchestrator reads `state.json` to get current tick
2. Orchestrator queries entities relevant to current lens
3. Agent simulates and emits events
4. Events are applied via `wsc-effects` skill
5. Tick advances

## File Locations

- **World state**: `src/world/state.json`
- **Entities**: `src/world/entities/`
- **Chronicle**: `src/world/chronicle.ndjson`
- **Examples**: `src/examples/`
