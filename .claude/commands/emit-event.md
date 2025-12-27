Create and emit a WSC chronicle event based on "$ARGUMENTS".

Expected argument format: `<event_type> [--where <entity_id>] [--who <entity_ids>]`
Examples:
- `battle.resolved --where region.vega --who force.red_7,force.blue_2`
- `agent.promoted --who agent.captain_reva`
- `treaty.signed --where region.core --who polity.hegemony,polity.federation`

Follow these steps:

1. **Validate event type against known families:**
   - Governance/politics: `treaty.signed`, `control.changed`, `election.held`
   - Economy: `shortage.started`, `route.established`, `trade.completed`
   - Conflict: `conflict.started`, `battle.resolved`, `asset.captured`
   - Discovery: `anomaly.discovered`, `artifact.recovered`
   - Character: `agent.promoted`, `agent.killed`, `agent.defected`
   - Settlement: `infrastructure.completed`, `unrest.spike`, `district.formed`
   - Or define a new event type if needed

2. **Build the event structure:**
```json
{
  "id": "evt_<unique>",
  "t_world": <current_tick>,
  "t_stream": "<optional_timestamp>",
  "type": "<event_type>",
  "where": "<entity_id>",
  "who": ["<entity_ids>"],
  "data": { /* type-specific payload */ },
  "causes": ["<prior_event_ids>"],
  "source": "lens.<source_lens>",
  "confidence": 0.0-1.0,
  "importance": 0.0-1.0
}
```

3. **Determine the `data` payload** based on event type:
   - `battle.resolved`: winner, losses, territory_changed
   - `treaty.signed`: terms, duration, signatories
   - `agent.promoted`: new_role, old_role, reason
   - etc.

4. **Calculate importance score** based on:
   - Simulation impact (territory, resources)
   - Narrative impact (named characters, rare outcomes)
   - Causal significance (does this enable other events?)

5. **Define effect function** (what world state changes):
   - Which entities are modified?
   - What attributes change?
   - Are new relationships created/destroyed?

6. **Output:**
   - Complete event JSON
   - Effect function pseudocode
   - Suggested follow-up events (causal chain)
   - Narrative summary (1-2 sentences for chronicle)
