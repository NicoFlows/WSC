# Agent Test Protocol: Galactic-4X

Tests the `galactic-4x` agent for correct strategic simulation, event emission, and drill-down opportunity creation.

## Prerequisites

- Active world with competing polities
- At least 2 regions with presence entities
- Forces assigned to regions
- Chronicle with conflict context

## Test Cases

### TC-01: Basic Tick Resolution

**Setup:**
Use Vega Conflict scenario with Hegemony vs Free Traders.

**Action:**
```
Invoke galactic-4x agent with prompt:
"Simulate one strategic tick for the Vega system. Consider the current
force positions, influence levels, and recent events. Use the wsc-chronicle
skill to emit any events that occur. This is a galactic-scale event,
so use --scale galactic."
```

**Expected Behaviors:**
- [ ] Agent reads current world state (tick number)
- [ ] Agent queries force and polity entities
- [ ] Agent evaluates strategic situation
- [ ] Agent emits events with t_scale: galactic

**Validation:**
```bash
# Check galactic events were emitted
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --scale galactic --last 3
```

---

### TC-02: Fleet Movement Event

**Setup:**
Forces positioned in different regions.

**Action:**
```
Invoke galactic-4x agent with prompt:
"The Hegemony 7th Fleet is preparing to pursue the Free Trader Raiders.
Emit a fleet.moved event showing their movement within the Vega system.
Use galactic scale with appropriate hierarchical time."
```

**Expected Behaviors:**
- [ ] Agent emits fleet.moved or similar event
- [ ] Event includes from/to locations in data
- [ ] Force entity is in who array
- [ ] Scale is galactic, depth is 0

**Validation:**
```bash
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --type fleet.moved --last 1 --json
```

---

### TC-03: Opportunity Creation

**Setup:**
Strategic situation with drill-down potential.

**Action:**
```
Invoke galactic-4x agent with prompt:
"Identify a tactical opportunity in the current strategic situation.
Emit an opportunity.created event that could trigger a drill-down to
a lower simulation scale (scene or action). Include recommended_lens
in the event data."
```

**Expected Behaviors:**
- [ ] Agent creates opportunity.created event
- [ ] Event data includes opportunity_type
- [ ] Event data includes recommended_lens
- [ ] Event data includes drill_down_available: true

**Validation:**
```bash
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --type opportunity.created --last 1 --json | jq '.[].data'
```

**Expected Data Structure:**
```json
{
  "opportunity_type": "convoy.interdiction|diplomatic.summit|...",
  "recommended_lens": "lens.scene|lens.embodied|lens.city",
  "drill_down_available": true
}
```

---

### TC-04: Influence Tracking

**Setup:**
After a battle or significant event.

**Action:**
```
Invoke galactic-4x agent with prompt:
"Evaluate how recent events have affected polity influence in the Vega region.
Emit an influence.changed event showing the shifts in power balance.
Include before/after values and contributing factors."
```

**Expected Behaviors:**
- [ ] Agent calculates influence changes
- [ ] Event includes numeric before/after values
- [ ] Contributing factors are documented
- [ ] Both affected polities are in who array

**Validation:**
```bash
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --type influence.changed --last 1 --verbose
```

---

### TC-05: Causality Chain

**Setup:**
Multiple related events in chronicle.

**Action:**
```
Invoke galactic-4x agent with prompt:
"A consequence of the Battle of the Outer Belt (evt_10492) is occurring.
Emit an appropriate strategic-level event and link it causally using
--causes evt_10492 in the emit command."
```

**Expected Behaviors:**
- [ ] Agent sets causes array correctly
- [ ] Event logically follows from cited cause
- [ ] Causality chain is queryable

**Validation:**
```bash
# Find events caused by the battle
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --caused-by evt_10492
```

---

### TC-06: Multi-Event Tick

**Setup:**
Active conflict with multiple ongoing situations.

**Action:**
```
Invoke galactic-4x agent with prompt:
"Simulate a complex strategic tick where multiple events occur:
1. A fleet movement
2. An influence shift
3. An opportunity for drill-down
Emit all three events with appropriate causality links between them."
```

**Expected Behaviors:**
- [ ] Agent emits 3 distinct events
- [ ] Events are causally linked where appropriate
- [ ] All events share same t_world (same tick)
- [ ] Events cover different aspects of the situation

**Validation:**
```bash
# Check last 3 events
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --last 3 --verbose
```

---

## Test Fixtures

### Minimal Polity Set
- polity.hegemony (dominant power)
- polity.free_traders (insurgent faction)

### Force Set
- force.hegemony_7th_fleet
- force.free_trader_raiders

### Region Set
- region.vega (contested)
- presence entities linking polities to region

## Scoring

| Criteria | Weight |
|----------|--------|
| Correct event types | 25% |
| Valid hierarchical time (galactic, depth 0) | 20% |
| Causality linking | 20% |
| Strategic coherence | 20% |
| Opportunity generation | 15% |

## Notes

- Galactic-4X should always emit at t_scale: galactic, t_depth: 0
- Events should reflect multi-day/week timescales
- Opportunities should specify which lens should resolve them
- Force strength and influence values should be realistic (0-1)
- Agent should consider scenario rules from scenario.json
