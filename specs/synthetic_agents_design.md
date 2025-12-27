# Synthetic Data Generation via Sub-Agents

## Overview

Instead of building full game UIs to test WSC, we use Claude Code sub-agents as **synthetic game engines**. Each agent "plays" a specific lens/genre, reading world state, making decisions based on entity AI blocks, and emitting events back to the chronicle.

This approach:
- Validates the data model without UI development
- Generates realistic test data at scale
- Tests AI integration patterns before real implementation
- Creates narrative content for artifact generation testing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Orchestrator Agent                       │
│  - Manages world clock (tick advancement)                   │
│  - Decides which lens agent to invoke                       │
│  - Maintains canonical world state                          │
│  - Triggers artifact generation                             │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Grand Strategy  │ │  Scene / RPG    │ │ Embodied Action │
│     Agent       │ │     Agent       │ │     Agent       │
│                 │ │                 │ │                 │
│ - Polity moves  │ │ - Dialogue      │ │ - Combat        │
│ - Influence     │ │ - Negotiations  │ │ - Chases        │
│ - Conflicts     │ │ - Intrigue      │ │ - Duels         │
│ - Opportunities │ │ - Character     │ │ - Quick events  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                    ┌─────────────────┐
                    │  World State    │
                    │  (JSON files)   │
                    │                 │
                    │  Chronicle      │
                    │  (NDJSON)       │
                    └─────────────────┘
```

## Agent Responsibilities

### Orchestrator Agent
- Advances world time (ticks)
- Reads current world state
- Identifies opportunities/triggers for drill-down
- Dispatches to appropriate lens agent
- Applies event effects to world state
- Decides when to generate artifacts

### Grand Strategy Agent
- Operates at polity/region level
- Makes decisions for AI-controlled polities using their `ai.doctrine`
- Calculates influence changes
- Triggers conflicts when thresholds crossed
- Creates opportunities for lower lenses
- Emits: `influence.changed`, `conflict.started`, `treaty.signed`, `opportunity.created`

### Scene/RPG Agent
- Operates at agent/character level
- Generates dialogue using entity `ai.voice` and `ai.persona`
- Resolves social encounters (negotiation, persuasion, intrigue)
- Makes NPC decisions based on `ai.goals` and `ai.emotional_state`
- Promotes important NPCs to named characters
- Emits: `dialogue.occurred`, `agent.promoted`, `agent.defected`, `intel.acquired`, `relationship.changed`

### Embodied Action Agent
- Operates at moment-to-moment level
- Resolves combat, chases, quick encounters
- Generates combat narration and taunts
- Determines outcomes based on entity capabilities
- Emits: `combat.resolved`, `target.destroyed`, `escape.successful`, `cargo.seized`

### Regional Strategy Agent (optional)
- Operates at force/locale level
- Moves forces, manages sieges
- Creates tactical opportunities
- Emits: `force.moved`, `siege.started`, `route.interdicted`

## Data Flow

### 1. Tick Cycle
```
1. Orchestrator reads world state
2. Orchestrator advances tick counter
3. Orchestrator runs Grand Strategy logic
4. Grand Strategy emits events + opportunities
5. Orchestrator applies effects to world state
6. Orchestrator checks for drill-down triggers
7. If trigger: dispatch to appropriate lens agent
8. Lens agent reads context, runs encounter
9. Lens agent emits events
10. Orchestrator applies effects
11. Repeat or end tick
```

### 2. Event Emission
```typescript
// Agent writes event to chronicle file (append)
{
  "id": "evt_{timestamp}_{random}",
  "t_world": current_tick,
  "type": "battle.resolved",
  "where": "region.vega",
  "who": ["force.hegemony_7th", "force.raiders"],
  "data": { ... },
  "causes": ["evt_previous"],
  "source": "agent.grand_strategy",
  "importance": 0.85
}
```

### 3. World State Updates
```typescript
// Agent writes patch file or updates entity JSON directly
// Orchestrator validates and applies
{
  "entity_id": "force.hegemony_7th",
  "patches": [
    {"path": "attrs.strength", "op": "set", "value": 0.5},
    {"path": "attrs.morale", "op": "add", "value": -0.1}
  ]
}
```

## File Structure

```
src/
├── world/                      # Canonical world state
│   ├── entities/               # Current entity states
│   │   └── *.json
│   ├── chronicle.ndjson        # Append-only event log
│   └── state.json              # World metadata (current tick, etc.)
├── examples/                   # Reference examples (read-only)
│   ├── entities/
│   └── events/
└── synthetic/                  # Synthetic generation config
    ├── scenarios/              # Starting scenarios
    └── outputs/                # Generated artifacts
```

## Agent Invocation

Each agent is a Claude Code slash command that:
1. Reads relevant world state files
2. Reads relevant entity AI blocks
3. Makes decisions / generates content
4. Writes new events to chronicle
5. Optionally updates entity files

### Example: Grand Strategy Agent

```markdown
# /run-grand-strategy

Read the current world state and advance one tick of grand strategy simulation.

For each AI-controlled polity:
1. Load polity entity with AI block
2. Assess current situation (influence, threats, opportunities)
3. Use AI doctrine to select action (invest, raid, diplomacy, etc.)
4. Calculate outcomes
5. Emit appropriate events

Check for:
- Influence threshold crossings → conflict.started
- Diplomatic opportunities → treaty proposals
- Economic triggers → shortage/boom events
- Drill-down opportunities → create for scene/embodied agents

Write all events to chronicle.ndjson
Update affected entity files
Report summary of tick
```

## Scenario Seeding

Agents can start from predefined scenarios:

```json
{
  "scenario_id": "vega_conflict_start",
  "description": "The powder keg is about to explode",
  "starting_tick": 1000,
  "entities_to_load": ["all_vega_examples"],
  "initial_tensions": [
    {"type": "influence_near_threshold", "region": "region.vega"},
    {"type": "personal_vendetta", "agents": ["captain_reva", "admiral_chen"]}
  ],
  "expected_events": ["conflict.started within 10 ticks"]
}
```

## Quality Controls

### Consistency Validation
After each agent run:
- Validate all entity references exist
- Check chronicle causality (no orphan causes)
- Verify influence sums are valid
- Ensure no contradictory events

### Narrative Coherence
- Events should follow from entity goals/doctrines
- Character actions should match personas
- Dialogue should use correct voice/vocabulary
- Importance scores should be justified

### Determinism Options
- Seed random decisions for reproducibility
- Log all decision points for debugging
- Allow replay from any tick

## Benefits

1. **Rapid Iteration**: Test data model changes without rebuilding games
2. **Scale**: Generate hundreds of ticks in minutes
3. **Narrative Quality**: AI-generated content that respects entity personalities
4. **Coverage**: Explore edge cases and rare events
5. **Artifact Testing**: Generate enough history for meaningful chronicles
6. **Schema Validation**: Real-world test of entity relationships

## Future Extensions

- **Parallel Timelines**: Run multiple "what-if" branches
- **Human-in-the-loop**: Pause for player decisions at key moments
- **Visualization**: Generate diagrams/maps from state
- **Benchmarking**: Measure AI quality and consistency
- **Training Data**: Use generated content to fine-tune prompts
