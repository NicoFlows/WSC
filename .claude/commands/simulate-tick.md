Simulate one or more world ticks based on "$ARGUMENTS".

Expected argument format: `[--ticks <count>] [--lens <lens_name>] [--focus <region_id>]`
Examples:
- (no args) - simulate 1 tick at grand strategy level
- `--ticks 10` - simulate 10 ticks
- `--lens regional --focus region.vega` - simulate regional activity in Vega
- `--ticks 5 --lens grand` - 5 grand strategy ticks

Follow these steps:

1. **Load current world state:**
   - All entities in scope
   - Active states (pending, active, cooldown)
   - Current tick number

2. **For each tick, at Grand Strategy level:**
   - Update influence drift per (polity, region)
   - Process state transitions (pending → active → cooldown)
   - Check conflict triggers (influence thresholds)
   - Generate opportunities for drill-down

3. **AI-driven decisions (if enabled):**
   - For each AI-controlled polity:
     - Assemble context (world state, relationships, goals)
     - Query AI for action selection
     - Apply fallback if AI unavailable
   - Actions: invest, propaganda, raid, aid, diplomacy

4. **Generate events:**
   - `influence.changed` for significant shifts
   - `conflict.started` when thresholds crossed
   - `state.transitioned` for state machine changes
   - `opportunity.created` for drill-down candidates

5. **Apply effects:**
   - Update entity attributes
   - Create/modify relationships
   - Advance tick counter

6. **Output:**
   - Events generated this tick
   - World state diff (what changed)
   - Opportunities available for drill-down
   - AI decisions made (with reasoning if available)
   - Narrative summary of the tick

7. **Drill-down prompts:**
   - List any high-importance opportunities
   - Suggest which lens should handle each
   - Indicate player intervention points

Example output:
```
Tick 1043 complete.
Events: 3 generated
  - evt_10500: influence.changed (polity.hegemony +0.1 in region.frontier)
  - evt_10501: conflict.started (region.vega, polity.hegemony vs polity.rebels)
  - evt_10502: opportunity.created (convoy.interdiction in region.trade_lane)

Opportunities for drill-down:
  [!] Battle in Vega (importance: 0.85) → Regional/Tactical lens
  [ ] Convoy interdiction (importance: 0.4) → Embodied lens

AI Decisions:
  - polity.hegemony: RAID region.frontier (goal: expand_territory)
  - polity.rebels: FORTIFY region.vega (goal: defend_homeland)
```
