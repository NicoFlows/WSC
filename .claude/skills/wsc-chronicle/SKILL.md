---
name: wsc-chronicle
description: Emit and query WSC chronicle events. Use when recording world events, checking event history, tracing causality chains, or finding events by type, location, or participants.
allowed-tools: Read, Write, Bash, Glob
---

# WSC Chronicle Management

The chronicle is an append-only event log that records everything that happens in the world. Events are stored in NDJSON format (one JSON object per line).

## Event Structure

```json
{
  "id": "evt_10001",
  "t_world": 1042.5,
  "t_stream": "02:14:33",
  "type": "battle.resolved",
  "where": "region.vega",
  "who": ["force.7th_fleet", "force.raiders"],
  "data": { /* event-specific payload */ },
  "causes": ["evt_10000"],
  "source": "lens.galactic",
  "confidence": 0.95,
  "importance": 0.8,
  "narrative_summary": "Human-readable description..."
}
```

## Event Types

| Family | Types | Description |
|--------|-------|-------------|
| **Governance** | `treaty.signed`, `control.changed`, `election.held` | Political events |
| **Economy** | `shortage.started`, `route.established`, `trade.completed` | Economic events |
| **Conflict** | `conflict.started`, `battle.resolved`, `asset.captured` | Military events |
| **Discovery** | `anomaly.discovered`, `artifact.recovered` | Exploration events |
| **Character** | `agent.promoted`, `agent.killed`, `agent.defected` | Character events |
| **Settlement** | `infrastructure.completed`, `unrest.spike` | City/locale events |
| **Scene** | `dialogue.occurred`, `skill_check.attempted`, `secret.revealed` | RPG events |
| **Opportunity** | `opportunity.created`, `opportunity.resolved` | Drill-down hooks |

## Commands

### Emit an Event

```bash
npx tsx .claude/skills/wsc-chronicle/scripts/emit.ts \
  --type battle.resolved \
  --where region.vega \
  --who force.7th_fleet,force.raiders \
  --data '{"outcome": "raider_victory"}' \
  --importance 0.8 \
  --summary "Raiders ambushed the 7th Fleet..."
```

### Query Events

```bash
# Recent events
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --last 10

# By type
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --type battle.resolved

# By location
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --where region.vega

# By participant
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --who agent.captain_reva

# By importance threshold
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --min-importance 0.7

# Time range
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --after 1040 --before 1050

# Combined
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --type conflict.* --where region.vega --min-importance 0.5
```

### Trace Causality

```bash
# Find what caused an event
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --causes-of evt_10492

# Find what an event caused
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --caused-by evt_10311
```

## Importance Scores

Events carry an `importance` score (0-1) used for artifact generation:

| Score | Meaning | Examples |
|-------|---------|----------|
| 0.9+ | Major turning point | War declared, leader killed |
| 0.7-0.9 | Significant | Battle won, alliance formed |
| 0.5-0.7 | Notable | Skirmish, trade deal |
| 0.3-0.5 | Minor | Patrol, routine event |
| <0.3 | Background | Ambient events |

## File Location

- **Chronicle**: `src/world/chronicle.ndjson`
- **Example events**: `src/examples/events/`
