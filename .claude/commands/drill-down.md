Drill down into a WSC opportunity or event, expanding it into a playable instance.

Expected argument format: `<event_or_opportunity_id> [--lens <lens_name>] [--ai-control <entity_ids>]`
Examples:
- `evt_10501` - expand conflict.started event
- `opp_convoy_42 --lens embodied` - expand as embodied action
- `evt_10501 --ai-control force.rebel_fleet` - AI controls rebel force

Follow these steps:

1. **Load the trigger event/opportunity:**
   - Validate it exists and is expandable
   - Determine appropriate lens (or use specified)
   - Identify participating entities

2. **Call lens.expand():**
   - Pass world snapshot (read-only)
   - Pass trigger event
   - Pass constraints (time budget, difficulty, stakes)

3. **Generate instance state:**
   - Instantiate required entities
   - Apply deferred characterization (name NPCs, add personalities)
   - Generate map/topology if needed
   - Set up AI decision points

4. **For each entity needing AI:**
   - Load AI block from canonical entity
   - Assemble situation context
   - Determine control mode (player | ai | hybrid)

5. **Present instance for play:**

**Regional/Tactical instance:**
```
=== Battle of Vega ===
Forces:
  - force.hegemony_7th (strength: 8, stance: aggressive)
    Commander: agent.admiral_chen (AI-controlled)
  - force.rebel_fleet (strength: 5, stance: defensive)
    Commander: agent.captain_reva (player-controlled)

Map: [display node graph or hex grid]
Objectives: Control station_alpha, Destroy enemy flagship

Turn 1 - rebel_fleet's turn:
Available actions: Move, Attack, Defend, Special, Retreat
```

**Scene/Tactical instance:**
```
=== Station Infiltration ===
Location: locale.port_nexus, site.docking_bay

Agents present:
  - agent.captain_reva (player)
  - agent.guard_01 (AI) - "A bored security officer"
  - agent.merchant_zara (AI) - "Knows about the shipment"

Objectives: Locate intel, Avoid detection, Optional: recruit ally

Available interactions: Talk, Sneak, Observe, Use item
```

**Embodied instance:**
```
=== Convoy Interdiction ===
Arena: trade_lane segment 7

Your ship: Cobra Mk III (shields: 100%, hull: 100%)
Hostiles: 3x Fighter (strength: weak), 1x Gunship (strength: medium)
Objective: Disable cargo hauler, escape

Controls: WASD move, Mouse aim, LMB fire, Space boost, E special
```

6. **Output:**
   - Instance state summary
   - Participant list with control modes
   - Objectives and win/loss conditions
   - Available actions/interactions
   - AI personalities for NPCs (if relevant)

7. **Ready for resolution:**
   - Accept player input
   - Process AI decisions
   - Advance instance state
   - Check for instance completion
   - When done, proceed to summarize
