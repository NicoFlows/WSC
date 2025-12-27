Generate a WSC artifact from chronicle events based on "$ARGUMENTS".

Expected argument format: `<artifact_type> [--from <start_tick>] [--to <end_tick>] [--focus <entity_id>]`
Artifact types: chapter | timeline | entity-history | highlights | map-diff
Examples:
- `chapter --from 100 --to 150`
- `entity-history --focus agent.captain_reva`
- `highlights --from 0 --to 1000`
- `timeline --focus polity.hegemony`

Follow these steps:

1. **Query chronicle events** within scope:
   - Time range (t_world)
   - Entity focus (who, where)
   - Minimum importance threshold

2. **Cluster events** by:
   - Causal chains (follow `causes` links)
   - Time windows
   - Entity involvement
   - Geographic proximity (where)

3. **Generate artifact based on type:**

**Chapter (session_chapter.md):**
- Group events into narrative beats
- Use AI (narrative tier) to generate prose
- Include entity perspectives
- Format as markdown with headers

**Timeline (timeline.json):**
```json
{
  "entries": [
    {
      "t_world": <tick>,
      "title": "<short description>",
      "importance": 0.0-1.0,
      "entities": ["<entity_ids>"],
      "event_ids": ["<event_ids>"]
    }
  ]
}
```

**Entity History (entity_histories/<id>.md):**
- Extract events involving this entity
- Generate narrative arc
- Include relationship changes
- Note key decisions/moments

**Highlights (highlights.json):**
- Filter by importance > threshold
- Include clip markers (t_stream if available)
- Generate short descriptions
- Rank by combined importance

**Map Diff:**
- Show control/influence changes
- Highlight territorial shifts
- Mark significant battles/events

4. **Apply chorus data** (if available):
   - Boost importance for community-highlighted moments
   - Include sentiment annotations
   - Note meme-worthy quotes

5. **Output:**
   - Generated artifact file(s)
   - Summary statistics
   - Suggested follow-up artifacts
