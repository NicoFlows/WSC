# WSC Example Data

This directory contains example JSON files demonstrating the WSC entity and event schemas. All examples are part of a coherent mini-world set in a sci-fi space opera setting.

## The Vega Conflict

The examples depict an ongoing conflict between:
- **The Terran Hegemony** - An authoritarian military regime controlling human space
- **The Free Traders Confederacy** - A loose alliance of independent captains and merchants

The action centers on **Vega System**, a contested industrial hub where Hegemony occupation forces clash with Free Trader raiders.

## Directory Structure

```
src/examples/
├── entities/           # Entity definitions
│   ├── polity.*.json   # Factions/nations
│   ├── region.*.json   # Star systems/provinces
│   ├── presence.*.json # Polity-region relationships
│   ├── force.*.json    # Fleets/armies
│   ├── locale.*.json   # Stations/cities
│   ├── feature.*.json  # Planets/terrain
│   ├── link.*.json     # Routes/connections
│   ├── site.*.json     # Districts/zones
│   ├── agent.*.json    # Characters
│   └── holding.*.json  # Assets/artifacts
├── events/             # Chronicle events
│   └── *.json          # Various event types
└── README.md           # This file
```

## Entity Examples

### Grand-scale Entities
| File | Description |
|------|-------------|
| `polity.hegemony.json` | The authoritarian Terran Hegemony |
| `polity.free_traders.json` | The libertarian Free Traders Confederacy |
| `region.vega.json` | The contested Vega star system |
| `region.nexus_prime.json` | The Hegemony capital system |
| `presence.hegemony.vega.json` | Hegemony presence in Vega |
| `presence.free_traders.vega.json` | Free Trader presence in Vega |
| `force.hegemony_7th_fleet.json` | Hegemony military force |
| `force.free_trader_raiders.json` | Free Trader raider squadron |

### Regional-scale Entities
| File | Description |
|------|-------------|
| `locale.port_nexus.json` | Neutral trade station |
| `locale.garrison_alpha.json` | Hegemony military base |
| `feature.vega_prime.json` | Habitable planet |
| `feature.outer_belt.json` | Asteroid field (raider hideout) |
| `link.nexus_trade_lane.json` | Major trade route |
| `link.belt_passage.json` | Secret smuggler route |

### Locale-scale Entities
| File | Description |
|------|-------------|
| `site.docking_bay_7.json` | Commercial docking area |
| `site.command_center.json` | Military command facility |

### Agent-scale Entities
| File | Description |
|------|-------------|
| `agent.captain_reva.json` | Free Trader raider captain (protagonist) |
| `agent.admiral_chen.json` | Hegemony fleet admiral (antagonist) |
| `agent.kai_chen.json` | Young pilot with hidden connection |
| `agent.zara.json` | Neutral information broker |
| `holding.wandering_star.json` | Reva's legendary ship |
| `holding.chen_evidence.json` | Damning intelligence on Admiral Chen |

## Event Examples

| File | Type | Description |
|------|------|-------------|
| `conflict.started.json` | conflict.started | Open warfare declared in Vega |
| `battle.resolved.json` | battle.resolved | Battle of the Outer Belt outcome |
| `agent.promoted.json` | agent.promoted | Kai Chen's field promotion |
| `intel.acquired.json` | intel.acquired | Strategic intelligence obtained |
| `influence.changed.json` | influence.changed | Shift in regional influence |
| `opportunity.created.json` | opportunity.created | Convoy interdiction opportunity |
| `dialogue.occurred.json` | dialogue.occurred | Character moment between Reva and Kai |

## Key Features Demonstrated

### AI Integration
Every entity includes an `ai` block with:
- `persona` - Character/entity identity for LLM context
- `voice` - Speech patterns and vocabulary
- `goals` - Current objectives
- `memory` - Key events the entity remembers
- `secrets` - Information known only to this entity

### Relationships
Entities reference each other through:
- Direct ID references (`owner`, `location`, `affiliation`)
- Relationship objects with trust and history
- Event causality chains (`causes` array)

### Narrative Hooks
Each entity includes elements for emergent storytelling:
- `scene_hooks` - Potential dramatic situations
- `rumors` - Information floating in the world
- `secrets` - Hidden truths that can be revealed
- `narrative_summary` - Human-readable event descriptions

## Using These Examples

1. **Schema Reference**: Use these as templates when creating new entities
2. **Test Data**: Load these for testing lens implementations
3. **AI Training**: Use for few-shot prompting when generating new entities
4. **World Building**: Extend this world or use as inspiration for new settings

## Genre Adaptation

While these examples use sci-fi trappings, the same schemas work for any genre:

| This Example | Fantasy Equivalent | Historical Equivalent |
|--------------|-------------------|----------------------|
| polity.hegemony | Kingdom of the Iron Throne | The Roman Empire |
| region.vega | The Contested Marches | Disputed Border Province |
| force.hegemony_7th_fleet | The Royal Army | VII Legion |
| locale.port_nexus | The Crossroads Inn | Mediterranean Trade Port |
| agent.captain_reva | The Exiled Knight | The Renegade General |
