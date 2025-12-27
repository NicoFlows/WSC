# CLAUDE.md - World State Chronicler (WSC)

## Project Overview

WSC is a **continuity and memory framework** for games—a canonical world state graph plus an append-only chronicle (event log) that supports multiple gameplay "lenses" (genres/zoom levels). Each lens can **expand** part of the world into a playable instance, then **summarize** outcomes back into canonical events and world updates.

### Core Purpose

Enable **epic continuity** across multiple scales—where galaxy-scale political and military forces coexist with intimate character-driven moments, and both scales meaningfully inform one another. Think Dune, Star Wars, or long-running tabletop campaigns.

### Key Inspirations

- **Elite Dangerous BGS** - Large-scale persistent faction simulation
- **Microscope RPG** - Zoomable historical storytelling
- **Strategy/City Builder/RPG games** - Each excels at different narrative scales

## Architecture

### Synthetic Agents Approach

Instead of building full game UIs, WSC uses **Claude Code sub-agents as synthetic game engines**. Each agent "plays" a specific genre, reading world state, making AI-driven decisions, and emitting events back to the chronicle.

```
┌─────────────────────────────────────────────────────────────┐
│                     Orchestrator Agent                       │
│  - Manages world clock (tick advancement)                   │
│  - Decides which lens agent to invoke                       │
│  - Maintains canonical world state                          │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Grand Strategy  │ │  Scene / RPG    │ │ Embodied Action │
│     Agents      │ │     Agent       │ │     Agent       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                              │
                    ┌─────────────────┐
                    │  World State    │
                    │  + Chronicle    │
                    └─────────────────┘
```

### Genre-Based Agent Hierarchy

| Agent | Genre Style | Scale | Timescale |
|-------|-------------|-------|-----------|
| `galactic-4x` | Stellaris / Sins of a Solar Empire | Star systems, empires, fleets | Days to weeks |
| `continental-strategy` | Civilization | Continents, nations, armies | Seasons to years |
| `city-builder` | Cities: Skylines | Cities, districts, infrastructure | Weeks to months |
| `party-rpg` | Baldur's Gate 3 | Characters, dialogue, tactical combat | Minutes to hours |
| `action-sim` | Elite Dangerous | Ships, FPS, real-time combat | Seconds to minutes |

## Directory Structure

```
WSC/
├── CLAUDE.md               # This file
├── specs/                  # Design specifications
│   ├── WSC_design_goals_v1.0.md    # Conceptual overview
│   ├── WSC_design_doc_v1.0.md      # Technical specification
│   └── synthetic_agents_design.md  # Sub-agent architecture
├── src/
│   ├── world/              # Active world state (runtime)
│   │   ├── entities/       # Current entity JSON files
│   │   ├── chronicle.ndjson # Append-only event log
│   │   └── state.json      # World metadata (tick, etc.)
│   └── examples/           # Reference entity/event examples
│       ├── entities/       # Example entities (polities, agents, etc.)
│       ├── events/         # Example chronicle events
│       └── locations/      # Location hierarchy examples
├── ai_docs/                # Library documentation
├── .claude/
│   ├── agents/             # Sub-agent system prompts
│   │   ├── wsc-orchestrator.md
│   │   ├── galactic-4x.md
│   │   ├── continental-strategy.md
│   │   ├── city-builder.md
│   │   ├── party-rpg.md
│   │   └── action-sim.md
│   └── commands/           # Slash commands
│       ├── run-simulation.md
│       ├── simulate-tick.md
│       ├── drill-down.md
│       ├── new-entity.md
│       ├── emit-event.md
│       ├── validate-world.md
│       └── ... (others)
└── requirements.txt        # Python dependencies
```

## Entity Model

All entities share common fields plus type-specific attributes:

```json
{
  "id": "type.slug",
  "type": "entity_type",
  "name": "Display Name",
  "tags": ["tag1", "tag2"],
  "attrs": { /* type-specific */ },
  "ai": { /* LLM integration block */ }
}
```

### Entity Types

| Type | Description | Examples |
|------|-------------|----------|
| **Polity** | Faction, nation, guild | Terran Hegemony, Free Traders |
| **Region** | Star system, province | Vega System, The Frontier |
| **Presence** | Polity-region relationship | Influence, control, states |
| **Force** | Fleet, army, warband | 7th Fleet, Raider Squadron |
| **Locale** | Station, city, dungeon | Port Nexus, Garrison Alpha |
| **Feature** | Planet, terrain, anomaly | Vega Prime, Outer Belt |
| **Link** | Route, jump lane, portal | Nexus Trade Lane |
| **Site** | District, zone within locale | Docking Bay 7 |
| **Agent** | Character, hero, leader | Captain Reva, Admiral Chen |
| **Holding** | Asset, artifact, ship | Wandering Star, Secret Intel |

### AI Integration Block

Every entity includes an `ai` block for LLM-driven behavior:

```json
{
  "ai": {
    "persona": "Character/entity identity description",
    "voice": {
      "tone": "weary | formal | aggressive | etc.",
      "vocabulary": ["preferred", "terms"],
      "speech_patterns": "Quirks and patterns"
    },
    "goals": ["objective_1", "objective_2"],
    "memory": ["evt_id_1", "evt_id_2"],
    "secrets": ["hidden fact 1"]
  }
}
```

## Chronicle Events

Events are append-only records in NDJSON format:

```json
{
  "id": "evt_10492",
  "t_world": 1042.33,
  "type": "battle.resolved",
  "where": "region.vega",
  "who": ["force.red_7", "force.blue_2"],
  "data": {"winner": "force.red_7", "losses": {"red": 3, "blue": 9}},
  "causes": ["evt_10311"],
  "source": "lens.regional",
  "confidence": 0.98,
  "importance": 0.91
}
```

### Event Type Families

- **Governance**: `treaty.signed`, `control.changed`, `election.held`
- **Economy**: `shortage.started`, `route.established`, `trade.completed`
- **Conflict**: `conflict.started`, `battle.resolved`, `asset.captured`
- **Discovery**: `anomaly.discovered`, `artifact.recovered`
- **Character**: `agent.promoted`, `agent.killed`, `agent.defected`
- **Settlement**: `infrastructure.completed`, `unrest.spike`, `district.formed`
- **Scene**: `dialogue.occurred`, `skill_check.attempted`, `secret.revealed`

## Slash Commands

### Simulation Commands

| Command | Description |
|---------|-------------|
| `/run-simulation` | Launch the orchestrator agent to run full simulation |
| `/simulate-tick [args]` | Simulate one or more world ticks |
| `/drill-down <event_id>` | Expand an event into a playable instance |
| `/run-scene` | Run a dialogue/character scene (party-rpg agent) |
| `/run-combat` | Run tactical combat (party-rpg agent) |
| `/run-action` | Run real-time action encounter (action-sim agent) |

### Entity & Event Commands

| Command | Description |
|---------|-------------|
| `/new-entity <type> <name>` | Create a new entity definition |
| `/emit-event <type>` | Create and emit a chronicle event |
| `/validate-world` | Validate world state consistency |
| `/summarize-instance` | Summarize a completed instance back to canon |

### Utility Commands

| Command | Description |
|---------|-------------|
| `/load-specs [file]` | Load WSC specifications |
| `/load-docs [file]` | Load library documentation |
| `/generate-artifact` | Generate chronicle artifacts (summaries, timelines) |
| `/ai-prompt <entity>` | Generate or test AI prompts for entities |
| `/new-lens <name>` | Scaffold a new gameplay lens |
| `/code-review [path]` | Code review for WSC codebase |
| `/create-test [path]` | Create test cases |

## Development Workflow

### Initializing the World

1. Run `/run-simulation` with `INIT` command
2. Copies example entities to `src/world/entities/`
3. Creates `state.json` with starting tick
4. Creates empty `chronicle.ndjson`

### Running Simulation

1. `/simulate-tick --ticks 5` - Run 5 ticks of grand strategy
2. Review generated opportunities
3. `/drill-down evt_xxxxx` - Expand interesting events
4. `/run-scene` or `/run-action` for detailed resolution
5. `/summarize-instance` - Write results back to canon

### Creating Content

1. `/new-entity polity my_faction` - Create new faction
2. Edit the generated JSON to customize
3. `/validate-world` - Check consistency
4. `/emit-event conflict.started --who polity.my_faction,...`

## Coding Guidelines

### JSON Entity Files

- Use `type.slug` format for IDs (e.g., `agent.captain_reva`)
- Include complete `ai` block for LLM integration
- Reference other entities by full ID
- Keep attribute values in valid ranges (0-1 for normalized)

### Chronicle Events

- Always include required fields: `id`, `t_world`, `type`, `where`, `who`
- Link causal chains via `causes` array
- Set `importance` scores (0-1) for artifact generation
- Include `narrative_summary` for human-readable descriptions

### Sub-Agent Development

- Agent prompts are in `.claude/agents/*.md`
- Follow YAML frontmatter format for metadata
- Include clear decision-making rules
- Define event types the agent can emit
- Specify what context the agent needs

### Python Code (when implemented)

- Follow PEP 8 style guidelines
- Use type hints for function signatures
- Tests in `tests/` directory using pytest
- Document entity schemas in docstrings

## Key Concepts

### Zoom = Transfer of Authority

Zooming is not a camera operation—it's a **transfer of authority and resolution**:

- High zoom: Large time steps, abstract outcomes, intent-driven
- Low zoom: Fine-grained action, player skill matters, characters emerge

### Deferred Characterization

Characters aren't fully instantiated by default:
- Most exist as abstract roles or probabilities
- Gain names, personality, memory when drilled into
- Avoid "cardboard NPCs" while supporting epic scope

### Importance Score

Events carry importance (0-1) based on:
- Simulation impact (territory, resources, control)
- Narrative impact (named characters, rare outcomes)
- Player attention (drill-ins, focus)
- Causal significance (enables other events)

### Canon vs Instance

- **Canon**: World state + chronicle (authoritative truth)
- **Instance**: Temporary playable expansion (ephemeral)
- Instances summarize back to canon via events

## Example Scenario: The Vega Conflict

The examples depict an ongoing conflict between:
- **The Terran Hegemony** - Authoritarian military regime
- **The Free Traders Confederacy** - Independent captains and merchants

Key characters:
- **Captain Reva** - Free Trader raider captain (protagonist)
- **Admiral Chen** - Hegemony fleet admiral (antagonist)
- **Kai Chen** - Young pilot with hidden connection
- **Zara** - Neutral information broker

## Resources

### Specifications

- `specs/WSC_design_goals_v1.0.md` - Conceptual overview and philosophy
- `specs/WSC_design_doc_v1.0.md` - Technical specification with schemas
- `specs/synthetic_agents_design.md` - Sub-agent architecture

### Examples

- `src/examples/entities/` - Complete entity examples
- `src/examples/events/` - Chronicle event examples
- `src/examples/locations/wsc/` - Location hierarchy examples
- `src/examples/README.md` - Guide to example data

### Agent Documentation

- `.claude/agents/wsc-orchestrator.md` - Master controller
- `.claude/agents/galactic-4x.md` - 4X strategy agent
- `.claude/agents/party-rpg.md` - RPG/dialogue agent
- `.claude/agents/action-sim.md` - Action/combat agent
