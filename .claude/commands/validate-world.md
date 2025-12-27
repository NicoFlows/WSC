Validate WSC world state consistency. If "$ARGUMENTS" specifies a file or directory, validate that content. Otherwise, validate the entire world state.

Follow these steps:

1. **Schema Validation:**
   - All entity IDs follow `type.slug` format
   - Required fields present for each entity type
   - AI blocks have valid structure
   - Attribute values in valid ranges (0-1 for normalized values)

2. **Referential Integrity:**
   - All entity references point to existing entities
   - Relationship edges have valid source/target
   - Event `who` and `where` reference existing entities
   - Event `causes` reference existing events
   - Force/Agent locations are valid regions/locales

3. **Chronicle Consistency:**
   - Events are ordered by t_world
   - No duplicate event IDs
   - Causal chains form valid DAG (no cycles)
   - Effect results match expected world state

4. **Presence/Control Consistency:**
   - Presence records exist for claimed control
   - Influence values sum appropriately per region
   - No orphaned presence records

5. **AI Block Validation:**
   - Persona is non-empty string
   - Voice has required fields (tone)
   - Goals array is non-empty
   - Memory references valid event IDs
   - Relationship references valid entity IDs

6. **Cross-lens Consistency:**
   - Drill-down triggers reference valid opportunities
   - Summarized events match lens authority scope
   - Instance states properly cleaned up

7. **Output report:**
   - Total entities by type
   - Total events in chronicle
   - Validation errors (critical)
   - Validation warnings (non-critical)
   - Orphaned entities (no relationships)
   - Suggested fixes for common issues

8. **Auto-fix options:**
   - Remove orphaned references
   - Normalize out-of-range values
   - Generate missing required fields with defaults
   - Rebuild indexes
