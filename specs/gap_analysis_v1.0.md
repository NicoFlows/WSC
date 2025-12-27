# WSC Gap Analysis: Cross-Agent Data Flow

## Executive Summary

This document analyzes gaps in the WSC entity model and infrastructure required for successful cross-agent simulation, where higher-level agents (galactic-4x, continental-strategy) generate opportunities that lower-level agents (party-rpg, action-sim) can expand and resolve.

**Assessment**: The existing entity schemas are surprisingly rich, but several structural gaps prevent clean handoff between agents.

---

## Current State: What Works Well

### Strong Entity Schemas

| Entity | Strength | Notes |
|--------|----------|-------|
| **Agent** | Excellent | Has skills, emotional_state, relationships, voice, secrets, memory, quirks |
| **Holding (ships)** | Good | Has capabilities (speed, armor, etc.), crew capacity, history, secrets |
| **Force** | Good | Has composition, morale, supply, readiness, doctrine, tactics |
| **Locale/Site** | Good | Has atmosphere, tensions, rumors, scene_hooks, npcs_typical |
| **Location** | Excellent | Detailed geometry (rooms, doors, features), hierarchy, connections |
| **Opportunity (event)** | Good | Has target details, window, risk_assessment, recommended_lens |

### Example Quality

The Vega Conflict example set provides coherent, interconnected entities with rich AI blocks suitable for LLM-driven gameplay.

---

## Critical Gaps

### Gap 1: Instance Entity (Missing)

**Problem**: When we drill down from an opportunity into a playable encounter, there's no formal schema for the "instance" - the temporary expanded state.

**Current State**: Opportunities reference entities loosely; each agent must reconstruct context.

**Required**: A formal `Instance` entity that captures:

```json
{
  "id": "instance.convoy_raid_058",
  "type": "instance",
  "created_from": "evt_10530",
  "lens": "action-sim",
  "status": "active",

  "participants": [
    {
      "entity_id": "agent.captain_reva",
      "control": "player",
      "role": "attacker_lead",
      "starting_position": {"sector": "alpha", "coords": [0, 0, 0]}
    },
    {
      "entity_id": "holding.wandering_star",
      "control": "player",
      "role": "player_ship",
      "status": {"hull": 1.0, "shields": 1.0}
    },
    {
      "entity_id": "force.convoy_escort",
      "control": "ai",
      "role": "defender",
      "composition_spawned": ["ship.escort_1", "ship.escort_2"]
    }
  ],

  "objectives": {
    "attacker": [
      {"id": "disable_freighter", "type": "primary", "status": "incomplete"},
      {"id": "escape_clean", "type": "secondary", "status": "incomplete"}
    ],
    "defender": [
      {"id": "protect_convoy", "type": "primary", "status": "incomplete"},
      {"id": "destroy_raiders", "type": "secondary", "status": "incomplete"}
    ]
  },

  "arena": {
    "type": "space_tactical",
    "location_ref": "link.nexus_prime.vega",
    "features": ["asteroid_cluster", "debris_field", "sensor_shadow"],
    "dimensions": {"x": 10000, "y": 10000, "z": 2000, "units": "m"}
  },

  "time_context": {
    "world_tick_start": 1048.0,
    "world_tick_budget": 0.1,
    "instance_time_elapsed": 0
  },

  "state": {
    "phase": "engagement",
    "turn": 1,
    "events_this_instance": []
  }
}
```

### Gap 2: Equipment/Loadout (Missing from Agent)

**Problem**: Agents have skills but no equipment for FPS/ground combat. When action-sim runs a boarding action, what weapons does the character have?

**Current State**: No equipment system.

**Required**: Add `equipment` block to Agent:

```json
{
  "equipment": {
    "loadout_type": "combat_infiltration",
    "primary_weapon": {
      "id": "item.plasma_carbine",
      "type": "rifle",
      "damage": 0.6,
      "range": "medium",
      "ammo": 30,
      "ammo_max": 30
    },
    "secondary_weapon": {
      "id": "item.holdout_pistol",
      "type": "pistol",
      "damage": 0.3,
      "range": "short",
      "ammo": 12
    },
    "armor": {
      "id": "item.stealth_suit",
      "protection": 0.4,
      "stealth_bonus": 0.3,
      "special": ["thermal_dampening"]
    },
    "tools": ["hacking_kit", "lockpicks", "medkit"],
    "consumables": [
      {"type": "stim_pack", "quantity": 2},
      {"type": "chaff_grenade", "quantity": 1}
    ]
  }
}
```

**Also needed**: `Item` entity type for reusable item definitions.

### Gap 3: Scene Setup Context (Missing)

**Problem**: When party-rpg receives a dialogue scene opportunity, it needs structured setup information, not just entity references.

**Current State**: Opportunities point to entities; agent must reconstruct scene context.

**Required**: Scene setup packet:

```json
{
  "scene_setup": {
    "id": "scene.intel_deal",
    "type": "dialogue_negotiation",
    "location": "location.site.zaras_shop",

    "participants": [
      {
        "entity_id": "agent.captain_reva",
        "role": "negotiator",
        "control": "player",
        "position": "main_shop",
        "stance": "cautious",
        "known_info": ["zara_has_patrol_schedules", "hegemony_watching"],
        "hidden_info": ["zara_being_hunted"]
      },
      {
        "entity_id": "agent.kai_chen",
        "role": "companion",
        "control": "ai_ally",
        "position": "near_door",
        "stance": "watchful",
        "will_interject": true
      },
      {
        "entity_id": "agent.zara",
        "role": "npc_key",
        "control": "ai",
        "position": "counter_area",
        "stance": "guarded",
        "goals_this_scene": ["profit", "assess_danger", "maintain_cover"],
        "secrets_relevant": ["being_hunted", "knows_more_than_selling"]
      }
    ],

    "scene_context": {
      "trigger": "opp_intel_acquisition",
      "stakes": {
        "success": "obtain_patrol_schedules",
        "failure": "blown_cover_or_bad_intel",
        "complications": ["hegemony_informant", "zara_demands_favor"]
      },
      "atmosphere": "tense_commercial",
      "time_pressure": "low",
      "violence_likelihood": 0.2
    },

    "available_approaches": [
      {"id": "direct_purchase", "skill": "negotiation", "dc": 12},
      {"id": "appeal_to_history", "skill": "persuasion", "dc": 14},
      {"id": "intimidation", "skill": "intimidation", "dc": 16},
      {"id": "trade_secret", "requires": "has_tradeable_intel"}
    ],

    "branching_points": [
      {"trigger": "insight_check_success", "reveals": "zara_is_scared"},
      {"trigger": "mention_hegemony", "activates": "zara_paranoia"},
      {"trigger": "kai_interjects", "opportunity": "good_cop_approach"}
    ]
  }
}
```

### Gap 4: Combat Setup Context (Missing)

**Problem**: When action-sim receives a combat opportunity, it needs tactical setup, not just entity references.

**Required**: Combat setup packet:

```json
{
  "combat_setup": {
    "id": "combat.convoy_interdiction",
    "type": "space_combat",
    "scale": "skirmish",

    "arena": {
      "type": "space",
      "region": "link.nexus_prime.vega",
      "features": [
        {"id": "asteroid_cluster_1", "type": "cover", "position": [2000, 1500, 0]},
        {"id": "debris_field", "type": "hazard", "area": {"center": [5000, 3000, 0], "radius": 1000}},
        {"id": "sensor_shadow", "type": "stealth_zone", "area": {"center": [8000, 2000, 500], "radius": 2000}}
      ],
      "environmental": {
        "visibility": 0.7,
        "sensor_interference": 0.3,
        "nav_hazard": 0.2
      }
    },

    "forces": {
      "attackers": {
        "faction": "polity.free_traders",
        "units": [
          {
            "id": "ship.wandering_star",
            "entity_ref": "holding.wandering_star",
            "pilot": "agent.captain_reva",
            "crew": ["agent.kai_chen"],
            "position": [0, 0, 0],
            "vector": [100, 0, 0],
            "status": {"hull": 1.0, "shields": 1.0, "heat": 0.2}
          }
        ],
        "objectives": ["disable_freighter", "seize_cargo", "escape"],
        "constraints": ["minimize_casualties", "no_civilian_kills"]
      },
      "defenders": {
        "faction": "polity.hegemony",
        "units": [
          {
            "id": "ship.escort_1",
            "class": "corvette",
            "pilot_skill": 0.5,
            "position": [6000, 2000, 0],
            "status": {"hull": 1.0, "shields": 1.0}
          },
          {
            "id": "ship.freighter_target",
            "class": "freighter",
            "position": [7000, 2500, 0],
            "cargo": ["military_supplies", "fuel"],
            "non_combatant": true
          }
        ],
        "objectives": ["protect_convoy", "call_reinforcements"],
        "behavior": "defensive_escort"
      }
    },

    "rules_of_engagement": {
      "time_limit": 300,
      "reinforcement_timer": 180,
      "escape_vector": {"direction": [0, -1, 0], "safe_distance": 10000}
    }
  }
}
```

### Gap 5: Resolution Result Schema (Missing)

**Problem**: When a lower agent completes an encounter, how does it report results back? No standard format exists.

**Required**: Resolution result packet:

```json
{
  "resolution": {
    "instance_id": "instance.convoy_raid_058",
    "outcome": "partial_success",
    "duration": {
      "world_ticks_consumed": 0.08,
      "instance_time": "4m23s"
    },

    "objectives_status": {
      "disable_freighter": "success",
      "seize_cargo": "partial",
      "escape_clean": "success"
    },

    "entity_changes": [
      {
        "entity_id": "holding.wandering_star",
        "changes": {
          "status.hull": 0.67,
          "status.damaged_modules": ["port_thruster"],
          "needs_repair": true
        }
      },
      {
        "entity_id": "agent.captain_reva",
        "changes": {
          "ai.emotional_state.stress": "+0.1",
          "ai.skills.piloting": "+0.01"
        }
      },
      {
        "entity_id": "agent.kai_chen",
        "changes": {
          "ai.skills.gunnery": "+0.02",
          "ai.relationships.agent.captain_reva.trust": "+0.03"
        }
      }
    ],

    "new_entities": [
      {
        "type": "holding",
        "id": "holding.seized_supplies",
        "owner": "agent.captain_reva",
        "value": 0.4
      }
    ],

    "destroyed_entities": [
      {"entity_id": "ship.escort_1", "manner": "destroyed_in_combat"}
    ],

    "events_to_emit": [
      {
        "type": "combat.resolved",
        "data": {"winner": "attackers", "casualties": {"attackers": 0, "defenders": 1}}
      },
      {
        "type": "cargo.seized",
        "data": {"value": 0.4, "contents": ["military_supplies"]}
      }
    ],

    "consequences": {
      "immediate": [
        "Hegemony knows Wandering Star's position",
        "Garrison Alpha supply delayed"
      ],
      "strategic": [
        {"target": "presence.hegemony.vega", "effect": "influence", "delta": -0.02},
        {"target": "force.hegemony_7th_fleet", "effect": "supply", "delta": -0.05}
      ],
      "narrative": [
        "Hegemony will increase patrols",
        "Admiral Chen personally embarrassed"
      ]
    },

    "narrative_summary": "The Wandering Star ambushed a Hegemony supply convoy at waypoint sigma. Despite taking hull damage, Captain Reva disabled the lead escort and seized critical military supplies before escaping into the asteroid field. The raid was a propaganda victory for the Free Traders, though Hegemony reinforcements now know their position."
  }
}
```

### Gap 6: Quest/Mission Entity (Missing)

**Problem**: Multi-step objectives that span scenes have no tracking mechanism.

**Required**: Quest entity:

```json
{
  "id": "quest.whos_after_zara",
  "type": "quest",
  "name": "Who's After Zara?",
  "status": "active",

  "origin": {
    "created_by": "evt_1047_034",
    "discovered_in": "scene.intel_deal"
  },

  "objectives": [
    {
      "id": "investigate_threat",
      "description": "Find out who's hunting Zara",
      "status": "active",
      "hints": ["Check station security logs", "Ask contacts in the underworld"]
    },
    {
      "id": "decide_involvement",
      "description": "Decide whether to help Zara",
      "status": "locked",
      "unlocks_after": "investigate_threat"
    }
  ],

  "participants": ["agent.captain_reva", "agent.zara"],
  "importance": 0.6,
  "urgency": "moderate",

  "potential_outcomes": [
    {"id": "save_zara", "alignment": "heroic"},
    {"id": "sell_out_zara", "alignment": "pragmatic"},
    {"id": "ignore", "alignment": "neutral"}
  ],

  "expires": null
}
```

### Gap 7: Intel/Knowledge Entity (Missing)

**Problem**: What entities know affects their behavior, but there's no formal intel tracking.

**Required**: Intel entity:

```json
{
  "id": "intel.patrol_schedules_vega",
  "type": "intel",
  "name": "Hegemony Patrol Schedules (Vega)",

  "content": {
    "type": "military_intel",
    "accuracy": 0.85,
    "freshness": 0.9,
    "details": "30-day patrol rotation schedules for 7th Fleet in Vega system"
  },

  "known_by": [
    {"entity_id": "agent.captain_reva", "acquired": "evt_1047_033", "confidence": 0.85},
    {"entity_id": "polity.free_traders", "acquired": "evt_1047_040", "confidence": 0.7}
  ],

  "source": "agent.zara",
  "value": 0.7,
  "perishable": true,
  "expires_tick": 1077.0,

  "strategic_implications": [
    "Can predict patrol gaps for raiding",
    "Identifies vulnerable convoy routes",
    "Reveals force disposition"
  ]
}
```

### Gap 8: Condition/Status Effects (Missing)

**Problem**: Temporary states on entities (injured, inspired, suspicious, etc.) have no tracking.

**Required**: Add `conditions` array to entities:

```json
{
  "conditions": [
    {
      "id": "cond.hull_damage",
      "type": "damage",
      "severity": 0.33,
      "effects": {"speed": -0.1, "maneuverability": -0.15},
      "requires": "repair_at_shipyard",
      "cost_to_remove": 3400
    },
    {
      "id": "cond.combat_fatigue",
      "type": "stress",
      "severity": 0.2,
      "effects": {"reaction": -0.1, "judgment": -0.05},
      "expires_tick": 1050.0
    },
    {
      "id": "cond.hegemony_wanted",
      "type": "social",
      "effects": {"hegemony_hostile": true, "bounty": 50000},
      "permanent": false,
      "removal_conditions": ["bribe", "time_decay", "pardon"]
    }
  ]
}
```

---

## Secondary Gaps

### Gap 9: Item Entity Type (Missing)

Need standalone item definitions for equipment:

```json
{
  "id": "item.plasma_carbine",
  "type": "item",
  "category": "weapon_rifle",
  "name": "M-7 Plasma Carbine",
  "attrs": {
    "damage": 0.6,
    "range": "medium",
    "accuracy": 0.7,
    "rate_of_fire": "semi_auto",
    "ammo_type": "plasma_cell",
    "ammo_capacity": 30
  },
  "tags": ["military", "hegemony_standard", "common"]
}
```

### Gap 10: Spawned/Ephemeral Entity Distinction

**Problem**: During combat, we spawn generic enemies ("escort_1", "guard_3") that shouldn't persist.

**Required**: Mark entities as ephemeral:

```json
{
  "lifecycle": {
    "type": "ephemeral",
    "created_in": "instance.convoy_raid_058",
    "persists_if": "promoted_to_named"
  }
}
```

### Gap 11: Location-Entity Binding Inconsistency

**Problem**: Location files (in `locations/wsc/`) and Entity files (in `entities/`) are separate but reference each other. The naming is inconsistent:
- Location: `location.district.docking_bay_7`
- Entity: `site.port_nexus.docking_bay_7`

**Required**: Clear convention for how locations and entities relate:
- Either merge them
- Or establish clear naming/reference protocol

### Gap 12: Ship Combat Stats

**Problem**: The Wandering Star holding has `capabilities` (speed, armor, weapons as 0-1 values), but action-sim needs more:
- Current status vs maximum (damaged hull vs full hull)
- Specific weapon hardpoints
- Module configuration
- Ammunition tracking

**Required**: Expand ship holdings:

```json
{
  "combat_stats": {
    "hull": {"current": 0.67, "max": 1.0},
    "shields": {"current": 1.0, "max": 1.0, "recharge_rate": 0.1},
    "armor": {"type": "light", "resistance": {"kinetic": 0.3, "thermal": 0.2}},
    "power": {"total": 100, "allocated": {"weapons": 40, "shields": 30, "engines": 30}},
    "heat": {"current": 0.2, "max": 1.0, "dissipation": 0.05}
  },
  "hardpoints": [
    {"slot": "small_1", "weapon": "pulse_laser", "ammo": null},
    {"slot": "small_2", "weapon": "pulse_laser", "ammo": null},
    {"slot": "medium_1", "weapon": "multicannon", "ammo": {"current": 2100, "max": 2100}},
    {"slot": "medium_2", "weapon": "multicannon", "ammo": {"current": 2100, "max": 2100}}
  ],
  "modules": {
    "fsd": {"class": "B", "status": 1.0},
    "thrusters": {"class": "A", "status": 0.82},
    "power_plant": {"class": "B", "status": 1.0},
    "sensors": {"class": "C", "status": 1.0}
  }
}
```

---

## Cross-Agent Protocol Gaps

### Gap 13: Skill Check System Undefined

**Problem**: party-rpg mentions skill checks (Persuasion DC 12), but no system defines:
- What skills exist
- How difficulty is calculated
- How agent.ai.skills maps to checks
- Randomness/determinism rules

**Required**: Skill check protocol:

```json
{
  "skill_check_system": {
    "skills": ["persuasion", "intimidation", "insight", "deception", "stealth",
               "combat", "piloting", "hacking", "medicine", "survival"],

    "resolution": {
      "method": "skill_vs_dc",
      "formula": "skill_value * 20 + modifiers vs dc",
      "critical_success": "roll >= dc + 10",
      "critical_failure": "roll <= dc - 10"
    },

    "modifiers": {
      "relationship_bonus": "trust * 5",
      "emotional_penalty": "stress * -3",
      "circumstance": "varies"
    }
  }
}
```

### Gap 14: Combat Resolution System Undefined

**Problem**: action-sim describes combat but no standardized resolution system.

**Required**: Combat resolution protocol defining:
- Damage calculation
- Hit probability
- Maneuver resolution
- Status effect application

### Gap 15: Time Normalization

**Problem**: Different agents operate at different timescales:
- galactic-4x: days/weeks
- party-rpg: minutes/hours
- action-sim: seconds/minutes

How does 4 minutes of combat map to world ticks?

**Required**: Time normalization rules:

```json
{
  "time_mapping": {
    "world_tick_unit": "day",
    "conversions": {
      "action-sim": {"1_world_tick": "24_hours", "typical_encounter": "0.01_ticks"},
      "party-rpg": {"1_world_tick": "24_hours", "typical_scene": "0.05_ticks"},
      "city-builder": {"1_world_tick": "1_day", "typical_session": "30_ticks"},
      "galactic-4x": {"1_world_tick": "1_day", "typical_turn": "1_tick"}
    }
  }
}
```

---

## Recommendations

### Priority 1: Instance + Resolution (Critical Path)

Without these, agents can't hand off properly:
1. Define Instance entity schema
2. Define Resolution result schema
3. Implement in orchestrator

### Priority 2: Scene/Combat Setup (Usability)

Without these, lower agents waste tokens reconstructing context:
1. Define Scene setup packet schema
2. Define Combat setup packet schema
3. Add to drill-down command

### Priority 3: Equipment + Combat Stats (Action-Sim Viability)

Without these, action-sim can't run meaningful FPS/ground combat:
1. Add equipment to Agent
2. Define Item entity
3. Expand ship combat stats

### Priority 4: Quest + Intel (Narrative Continuity)

Without these, multi-scene stories can't track properly:
1. Define Quest entity
2. Define Intel entity
3. Add conditions to entities

### Priority 5: System Definitions (Polish)

These make simulation deterministic/reproducible:
1. Define skill check system
2. Define combat resolution system
3. Define time normalization

---

## Testing Strategy

### Minimum Viable Cross-Agent Test

To validate the system works:

1. **Setup**: Load Vega Conflict entities
2. **galactic-4x tick**: Generate convoy interdiction opportunity
3. **Orchestrator**: Create Instance from opportunity
4. **action-sim**: Receive combat setup, run encounter, return resolution
5. **Orchestrator**: Apply resolution to world state, emit events
6. **galactic-4x tick**: See effects of raid on influence/supply

### Required for Test

- [ ] Instance entity schema
- [ ] Combat setup packet
- [ ] Resolution result schema
- [ ] Ship combat stats expanded
- [ ] Time normalization rules

This test would validate the full drill-down/bubble-up flow.
