# Agent Integration Tests

This directory contains test protocols for verifying that sub-agents correctly interact with WSC scripts and produce valid outputs.

## Test Philosophy

Unlike script tests which can be fully automated, agent tests require an AI to run the agent and verify its behavior. These are **protocol-based tests** that define:

1. **Setup conditions** - What state the world needs to be in
2. **Agent invocation** - How to call the agent
3. **Expected behaviors** - What the agent should do
4. **Validation criteria** - How to verify correct operation

## Running Agent Tests

Agent tests are run by invoking Claude Code with the test protocol:

```bash
# Run a specific agent test
claude "Run the test protocol in tests/agents/galactic-4x.protocol.md"

# Run all agent tests
claude "Run all test protocols in tests/agents/"
```

## Test Protocol Format

Each `.protocol.md` file follows this structure:

```markdown
# Agent Test: [Agent Name]

## Prerequisites
- World state requirements
- Required entities
- Chronicle state

## Test Cases

### TC-01: [Test Name]
**Setup:** [Description of initial state]
**Action:** [Agent invocation command]
**Expected:**
- [ ] Agent reads required context
- [ ] Agent makes valid decisions
- [ ] Agent emits correct event types
- [ ] Events have valid hierarchical time
- [ ] Chronicle is updated correctly

## Validation Script
[Optional bash commands to verify state]
```

## Test Categories

### 1. Context Loading Tests
Verify agents correctly read:
- World state (tick, active world)
- Relevant entities
- Recent chronicle events
- Location data

### 2. Decision Making Tests
Verify agents:
- Consider available options
- Apply scenario rules
- Make consistent decisions
- Document reasoning

### 3. Event Emission Tests
Verify emitted events:
- Have valid structure (id, type, where, who)
- Use correct hierarchical time (t_world, t_scale, t_parent, t_depth)
- Include appropriate data payloads
- Link causality correctly

### 4. Scale Transition Tests
Verify drill-down behavior:
- Parent events are preserved
- Child scale is appropriate
- t_local advances correctly
- Depth increments properly

## Example Test Run

```
$ claude "Run tests/agents/party-rpg.protocol.md"

Running Party-RPG Agent Test Protocol...

TC-01: Scene Resolution
  ✓ Agent loaded world state
  ✓ Agent read relevant entities
  ✓ Agent queried recent events
  ✓ Agent emitted dialogue.occurred event
  ✓ Event has t_scale: scene
  ✓ Event has t_parent linking to trigger
  ✓ Chronicle updated with new event

TC-02: Combat Drill-down
  ✓ Agent detected combat trigger
  ✓ Agent spawned action-sim for resolution
  ✓ Received combat results
  ✓ Summarized outcomes to chronicle

3/3 test cases passed
```

## Creating New Test Protocols

1. Create `[agent-name].protocol.md` in this directory
2. Define prerequisites (required world state)
3. Write test cases with clear expected behaviors
4. Include validation commands where possible
5. Test the protocol manually first

## Test Data

Test fixtures are in `tests/fixtures/`:
- `test-world/` - Minimal world state for testing
- `test-entities/` - Standard test entities
- `test-events/` - Expected event outputs
