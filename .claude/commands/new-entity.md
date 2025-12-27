Create a new WSC entity definition based on "$ARGUMENTS".

Expected argument format: `<entity_type> <entity_name> [--genre <genre>]`
Examples:
- `agent captain_reva --genre scifi`
- `polity iron_kingdom --genre fantasy`
- `locale port_nexus`

Follow these steps:

1. **Determine entity type and validate:**
   - Polity (faction, nation, guild, corporation)
   - Region (star system, province, kingdom, zone)
   - Locale (station, city, dungeon, fortress)
   - Force (fleet, army, warband, expedition)
   - Agent (character, hero, leader)
   - Holding (asset, artifact, resource)
   - Link (route, road, jump lane, portal)
   - Feature (planet, mountain, river, anomaly)
   - Site (district, level, zone within locale)
   - Presence (polity-region relationship)

2. **Generate the entity JSON with:**
   - `id`: `<type>.<slug>` format
   - `type`: entity type
   - `name`: display name
   - `tags`: relevant descriptors
   - `attrs`: type-specific attributes (see spec 4.1)
   - `ai`: LLM integration block (see spec 4.5)

3. **For the AI block, include:**
   - `persona`: 2-3 sentence personality/identity description
   - `voice`: tone, vocabulary, speech_patterns
   - `goals`: 2-4 current objectives
   - Type-specific fields:
     - Polity: doctrine, relationships
     - Force: commander, morale, preferred_tactics
     - Agent: memory, secrets, emotional_state, relationships
     - Locale: atmosphere, active_tensions, rumors

4. **Output:**
   - Complete JSON entity definition
   - Suggested relationships to other entities
   - Example chronicle events this entity might generate
   - Sample AI prompt/response demonstrating the persona

Ensure the entity follows WSC schema conventions and is ready for use in the world state.
