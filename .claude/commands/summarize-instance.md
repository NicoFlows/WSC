Summarize a completed WSC instance back into canonical events and world updates.

Expected argument format: `<instance_id> [--importance <0.0-1.0>]`
Examples:
- `inst_battle_vega_001`
- `inst_scene_infiltration_042 --importance 0.9`

Follow these steps:

1. **Load completed instance state:**
   - Final positions/outcomes
   - Actions taken (player trace)
   - AI decisions made
   - Time elapsed (ticks consumed)

2. **Determine canonical outcomes:**
   - Who won/lost?
   - What changed hands (territory, holdings)?
   - Who died/defected/was promoted?
   - What was discovered/destroyed/created?

3. **Generate chronicle events:**
   - One event per significant outcome
   - Link causality (causes = [trigger_event_id])
   - Calculate importance scores
   - Assign to source lens

Common event mappings by lens:

**Regional/Tactical:**
- `battle.resolved` - force conflict outcome
- `control.changed` - territory transfer
- `force.destroyed` / `force.retreated`
- `asset.captured` / `asset.destroyed`

**Scene/Tactical:**
- `agent.killed` / `agent.captured`
- `agent.defected` / `agent.recruited`
- `holding.recovered` / `holding.stolen`
- `locale.sabotaged` / `intel.acquired`
- `agent.promoted` (for memorable NPCs)

**Embodied:**
- `target.destroyed` / `target.disabled`
- `cargo.seized` / `escape.successful`
- `agent.killed` (pilot deaths)

4. **Calculate importance** based on:
   - Entity salience (named characters > generics)
   - Outcome rarity (betrayal > standard victory)
   - Player investment (retries, time spent)
   - Strategic impact (control changes)

5. **Generate world patches:**
   - Update entity attributes
   - Create/remove relationships
   - Update presence/influence
   - Modify force strengths

6. **Handle promoted entities:**
   - If unnamed NPC became important, emit `agent.promoted`
   - Generate AI block for newly-promoted agents
   - Add to canonical world state

7. **Output:**
```
=== Instance Summary: Battle of Vega ===

Duration: 3 ticks consumed
Outcome: Rebel victory

Events generated:
  evt_10510: battle.resolved
    - winner: force.rebel_fleet
    - losses: hegemony 60%, rebels 30%
    - importance: 0.85

  evt_10511: agent.killed
    - who: agent.admiral_chen
    - cause: flagship destruction
    - importance: 0.72

  evt_10512: control.changed
    - where: region.vega
    - from: polity.hegemony
    - to: polity.rebels
    - importance: 0.91

World patches:
  - force.hegemony_7th.strength: 8 → 3
  - force.rebel_fleet.strength: 5 → 3
  - presence.hegemony.vega.control: true → false
  - presence.rebels.vega.control: false → true
  - agent.captain_reva.salience: 0.85 → 0.95

Narrative summary:
"In a decisive engagement over Vega, Captain Reva's outnumbered
rebel fleet defeated the Hegemony 7th Fleet, killing Admiral Chen
and seizing control of the system. The victory marks a turning
point in the rebellion."
```

8. **Cleanup:**
   - Archive instance state (for replay/debug)
   - Update world state with patches
   - Append events to chronicle
   - Trigger artifact generation if importance > threshold
