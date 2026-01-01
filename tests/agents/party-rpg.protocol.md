# Agent Test Protocol: Party-RPG

Tests the `party-rpg` agent for correct scene resolution, dialogue generation, and event emission.

## Prerequisites

- Active world with at least 2 agents
- At least one locale defined
- Chronicle with a triggering event (opportunity or battle result)

## Test Cases

### TC-01: Basic Scene Resolution

**Setup:**
Use example entities (Captain Reva, Kai Chen) at Port Nexus.

**Action:**
```
Invoke party-rpg agent with prompt:
"Run a brief character scene between Captain Reva and Kai Chen at Port Nexus
following the Battle of the Outer Belt. Use the wsc-chronicle skill to emit
the resulting event. Keep it to 2-3 exchanges of dialogue."
```

**Expected Behaviors:**
- [ ] Agent reads agent.captain_reva and agent.kai_chen entities
- [ ] Agent queries recent events to understand context
- [ ] Agent generates appropriate dialogue
- [ ] Agent uses chronicle emit script to record the scene

**Validation:**
```bash
# Check that a new scene event was emitted
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --last 1 --type dialogue.occurred

# Verify event structure
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --last 1 --json | jq '.[] | {type, t_scale, who}'
```

**Expected Event:**
```json
{
  "type": "dialogue.occurred",
  "t_scale": "scene",
  "who": ["agent.captain_reva", "agent.kai_chen"]
}
```

---

### TC-02: Hierarchical Time Handling

**Setup:**
Provide a parent event ID for drill-down context.

**Action:**
```
Invoke party-rpg agent with prompt:
"Resolve a scene that drills down from event evt_10492 (the Battle of the Outer Belt).
This is a scene-level drill-down, so use --scale scene, --parent evt_10492, and --depth 1
when emitting events. The scene should show the immediate aftermath."
```

**Expected Behaviors:**
- [ ] Agent sets t_scale to "scene"
- [ ] Agent sets t_parent to the provided event ID
- [ ] Agent sets t_depth to 1
- [ ] Agent preserves t_world from parent event

**Validation:**
```bash
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --parent evt_10492 --json
```

**Expected Output:**
Event with `t_parent: "evt_10492"` and `t_depth: 1`

---

### TC-03: Character Voice Consistency

**Setup:**
Use entities with defined voice attributes.

**Action:**
```
Invoke party-rpg agent with prompt:
"Generate a short dialogue where Captain Reva gives Kai Chen tactical advice.
Reva should speak with her characteristic weary veteran tone.
Emit the result as a dialogue.occurred event."
```

**Expected Behaviors:**
- [ ] Agent reads the ai.voice field from Captain Reva's entity
- [ ] Generated dialogue reflects the defined voice/tone
- [ ] Dialogue feels consistent with character background

**Validation:**
Manual review of dialogue content for voice consistency.

---

### TC-04: Event Data Payload

**Setup:**
Standard test setup.

**Action:**
```
Invoke party-rpg agent with prompt:
"Run a scene where Captain Reva reveals a secret to a trusted ally.
The event should include structured data about what was revealed.
Use the chronicle emit script with appropriate --data payload."
```

**Expected Behaviors:**
- [ ] Agent includes structured data in the event
- [ ] Data captures key scene outcomes
- [ ] Event type matches content (secret.revealed or similar)

**Validation:**
```bash
npx tsx .claude/skills/wsc-chronicle/scripts/query.ts --last 1 --json | jq '.[].data'
```

---

### TC-05: Combat Trigger Detection

**Setup:**
Scene context that could escalate to combat.

**Action:**
```
Invoke party-rpg agent with prompt:
"Run a tense confrontation scene between Captain Reva and a Hegemony agent.
If the scene escalates to combat, note that you would hand off to action-sim
(but don't actually spawn it for this test). Emit appropriate events for
the dialogue portion."
```

**Expected Behaviors:**
- [ ] Agent recognizes combat potential
- [ ] Agent notes hand-off point to action-sim
- [ ] Pre-combat dialogue is recorded
- [ ] Decision point for drill-down is clear

---

## Test Fixtures

### Minimal Entity Set
- agent.captain_reva (protagonist, Free Trader captain)
- agent.kai_chen (ally, young pilot)
- locale.port_nexus (neutral station)

### Context Events
- evt_10492 (Battle of the Outer Belt) - provides dramatic context

## Scoring

| Criteria | Weight |
|----------|--------|
| Correct event emission | 30% |
| Valid hierarchical time | 25% |
| Character voice consistency | 20% |
| Structured data quality | 15% |
| Context awareness | 10% |

## Notes

- Party-RPG should emit events with t_scale: "scene"
- Dialogue events should include participant info in data
- Combat should trigger opportunity for action-sim drill-down
- Agent should read entity ai.persona for characterization
