Generate or test an AI prompt for a WSC entity based on "$ARGUMENTS".

Expected argument format: `<entity_id> <prompt_type> [--situation <description>]`
Prompt types: dialogue | decision | narration | taunt | description
Examples:
- `agent.captain_reva dialogue --situation "merchant offers smuggling job"`
- `polity.hegemony decision --situation "rebels control 3 regions"`
- `force.iron_legion taunt --situation "outnumbered but winning"`
- `locale.port_nexus description --situation "player arrives at night"`

Follow these steps:

1. **Load or create the entity** with full AI block

2. **Assemble context packet:**
```json
{
  "entity": { /* full entity with ai block */ },
  "world_context": {
    "current_tick": <tick>,
    "recent_events": [ /* relevant events */ ],
    "nearby_entities": [ /* entities in proximity */ ],
    "active_conflicts": [ /* ongoing tensions */ ],
    "relationships": [ /* relevant edges */ ]
  },
  "situation": {
    "trigger": "<prompt_type>_request",
    "prompt": "<situation description>",
    "participants": [ /* other involved entities */ ],
    "constraints": {
      "max_tokens": <based_on_tier>,
      "temperature": <0.7 standard>,
      "must_include": [],
      "must_avoid": ["break character", "meta references"]
    }
  }
}
```

3. **Select appropriate tier:**
   - **Instant** (<500ms): taunts, short reactions
   - **Standard** (1-3s): dialogue, descriptions
   - **Strategic** (5-15s): polity decisions, major choices
   - **Narrative** (10-30s): chronicle prose

4. **Generate the prompt** using entity's AI block:
   - Incorporate persona as system context
   - Apply voice/tone constraints
   - Include relevant memories
   - Reference goals and emotional state

5. **Output:**
   - Complete system prompt
   - User prompt (situation)
   - Expected response format
   - Fallback response if LLM unavailable
   - Sample LLM response demonstrating correct tone/behavior

6. **Validation checklist:**
   - Does response stay in character?
   - Does it reference entity's goals/memories appropriately?
   - Does voice/tone match specification?
   - Is it the right length for the tier?
   - Does it avoid breaking world consistency?
