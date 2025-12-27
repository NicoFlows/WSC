# World State Chronicler (WSC) — Design Document v0.1

## 1. Summary

WSC is a **continuity and memory framework** for games: a canonical **World State Graph** plus an append-only **Chronicle (Event Log)** that supports multiple gameplay **lenses** (genres / zoom levels). Each lens can **expand** part of the world into a playable instance, then **summarize** outcomes back into canonical events and world updates. From the Chronicle, WSC generates **artifacts** (timelines, chapters, maps, highlight manifests) and optionally incorporates **chorus** (community reaction signals) to improve editorial selection.

**Primary objectives**

* Enable **multi-scale play** (galaxy → system → settlement/city → scene/tactical → pilot/action) within one coherent continuity.
* Make “zoom” a **transfer of authority and resolution**, not just a visual effect.
* Support **event-sourced history** so runs produce durable, shareable artifacts.
* Prove the concept quickly using **toy lenses** that validate state handoff up/down the stack.

Non-goals

* Not a universal physics engine.
* Not a replacement for a full game engine.
* Not a “metaverse” or global online protocol.

---

## 2. Key Concepts and Terminology

* **World State Graph**: canonical current truth (entities + relationships + properties).
* **Chronicle**: append-only event log representing how truth changed over time.
* **Lens**: a gameplay mode / genre view that temporarily owns a slice of authority.
* **Instance**: an expanded, playable snapshot created by a lens (ephemeral).
* **Expand**: transform canonical context into a playable instance.
* **Summarize**: transform instance results into canonical events + world updates.
* **Canon**: authoritative facts (world state + chronicle).
* **Chorus**: non-authoritative community/stream reaction signals used to select and frame artifacts.
* **Importance**: a scalar used for editorial ranking and retention decisions.

### Genre-Agnostic Entity Model

WSC uses abstract entity types that map to genre-specific implementations:

| Abstract Type | Sci-Fi Example | Fantasy Example | Historical Example |
|---------------|----------------|-----------------|-------------------|
| **Polity** | Faction, Corporation | Kingdom, Guild | Nation, Dynasty |
| **Region** | Star System | Province, Realm | Territory, County |
| **Locale** | Station, Outpost | City, Dungeon | Castle, Town |
| **Force** | Fleet, Squadron | Army, Warband | Legion, Company |
| **Agent** | Pilot, Commander | Hero, Lord | General, Diplomat |
| **Holding** | Ship, Module | Artifact, Keep | Estate, Relic |
| **Link** | Jump Lane, Trade Route | Road, Portal | Highway, River |

---

## 3. System Architecture

### 3.1 High-level flow

1. **Canonical tick** updates macro conditions (optional, e.g., daily galaxy tick).
2. A lens is invoked on an opportunity/event candidate.
3. Lens calls **expand(context)** → creates a playable **instance**.
4. Player/AI resolves instance.
5. Lens calls **summarize(result)** → emits canonical **events** into Chronicle.
6. WSC applies event effects to update **world state**.
7. Artifact pipeline reads Chronicle (+ chorus) to generate outputs.

### 3.2 Core modules

* `world/`: world graph store + schema + snapshots
* `chronicle/`: events store (NDJSON), indexes
* `lenses/`: implementations of expand/summarize
* `instances/`: ephemeral expanded state
* `artifacts/`: chronicle builders (markdown), highlight manifests, diagrams
* `chorus/`: sentiment/meme metrics (optional)

---

## 4. Data Model

The model is **semantic**: lenses exchange *facts and events* rather than low-level transforms.

### 4.1 Entity Types

All entities share:

* `id` (stable)
* `type` (one of the types below)
* `name` (optional)
* `tags` (freeform)
* `attrs` (type-specific fields)
* `ai` (optional LLM integration block — see section 4.5)

The entity model uses **genre-agnostic abstractions** that can be specialized for sci-fi, fantasy, historical, or other settings.

#### 4.1.1 Grand-scale Entities

**Polity** (faction, nation, guild, corporation)

* `id`: `polity.<slug>`
* `attrs`:

  * `allegiance` (optional parent polity)
  * `government` (monarchy, democracy, council, etc.)
  * `ethos` (optional) — used for narrative tone
  * `doctrines` (array of behavioral tendencies)
  * `resources` (macro resource buckets)

**Region** (star system, province, kingdom, zone)

* `id`: `region.<slug>`
* `attrs`:

  * `coords` (x,y,z or abstract graph position)
  * `security`, `economy`, `population` (optional)
  * `hazards` (array: piracy, monsters, storms, etc.)
  * `terrain` (optional genre-specific descriptor)

**Presence** (Polity ↔ Region relationship)

* `id`: `presence.<polity>.<region>`
* `attrs`:

  * `influence` (0–1)
  * `control` (boolean or rank)
  * `states_active` (array)
  * `states_pending` (array)
  * `states_cooldown` (array)

**Force** (fleet, army, warband, expedition)

* `id`: `force.<slug>`
* `attrs`:

  * `polity_id`
  * `strength` (coarse)
  * `composition` (optional breakdown)
  * `location` (region or locale id)
  * `stance` (aggressive, defensive, patrol, etc.)

#### 4.1.2 Regional-scale Entities

**Locale** (station, city, dungeon, fortress, outpost)

* `id`: `locale.<slug>`
* `attrs`:

  * `region_id`
  * `owner_polity_id`
  * `services` (array: market, shipyard, temple, guild hall)
  * `security_level`
  * `locale_type` (settlement, facility, wilderness, ruin)

**Feature** (planet, mountain, river, anomaly)

* `id`: `feature.<slug>`
* `attrs`:

  * `region_id`
  * `kind` (natural, constructed, magical, technological)
  * `properties` (biome, hazards, resources)

**Link** (route, road, jump lane, portal)

* `id`: `link.<a>.<b>`
* `attrs`:

  * `kind` (trade, military, secret, magical)
  * `capacity`, `risk`
  * `bidirectional` (boolean)

#### 4.1.3 Locale-scale Entities

**Site** (district, level, zone within a locale)

* `id`: `site.<locale>.<slug>`
* `attrs`:

  * `locale_id`
  * `owner_polity_id` (may differ from locale owner)
  * `population`
  * `prosperity`, `unrest`, `hazard` (0–1)
  * `infrastructure` (see below)

**Infrastructure** (part of Site or Locale)

Genre-agnostic categories:

* `power` (energy source: fusion, magic, water mill)
* `transit` (movement: elevator, road, teleporter)
* `housing` (population capacity)
* `production` (industry: shipyard, forge, farm)
* `defense` (walls, shields, garrison)
* `culture` (temples, academies, monuments)

#### 4.1.4 Agent-scale Entities

**Agent** (character, hero, leader, unit)

* `id`: `agent.<slug>`
* `attrs`:

  * `affiliation` (polity id)
  * `role` (governor, pilot, knight, merchant)
  * `traits` (small set)
  * `relationships` (edges to other agents)
  * `status` (active, missing, retired, dead)
  * `salience` (importance / promoted state)
  * `location` (locale or region id)

**Holding** (asset, artifact, resource, territory)

* `id`: `holding.<slug>`
* `attrs`:

  * `kind` (item, territory, title, secret)
  * `owner` (entity id)
  * `location` (entity id)
  * `value` (optional importance/power rating)

### 4.2 Relationships

Represent relationships as typed edges (either embedded or separate list):

* `controls(polity, region|locale|site)`
* `present_in(polity, region)` (Presence entity)
* `located_in(force|locale|agent, region|locale|site)`
* `allied_with(polity, polity)` / `at_war_with`
* `knows(agent, agent)` / `owes` / `serves` / `rivals`
* `owns(agent|polity, holding)`
* `connects(link, region|locale, region|locale)`

### 4.3 Chronicle Event Schema

Events are append-only records:

* `id` (unique)
* `t_world` (world time; tick-based)
* `t_stream` (optional; for media alignment)
* `type`
* `where` (entity id)
* `who` (array of entity ids)
* `data` (type-specific payload)
* `causes` (array of prior event ids)
* `source` (lens/system)
* `confidence` (0–1)
* `importance` (0–1)
* `media` (optional refs)

**Event type families**

* Governance/politics: `treaty.signed`, `control.changed`, `election.held`
* Economy: `shortage.started`, `route.established`
* Conflict: `conflict.started`, `battle.resolved`, `asset.captured`
* Discovery/exploration: `anomaly.discovered`, `artifact.recovered`
* Character: `character.promoted`, `character.killed`, `character.defected`
* Settlement: `infrastructure.completed`, `unrest.spike`, `district.formed`

### 4.4 World Updates (Effects)

Each event type has an **effect function** that patches world state. Effects should be:

* deterministic where possible
* idempotent when replayed
* scoped to relevant entities

Example: `battle.resolved` reduces `force.strength`, may flip `presence.control`, may change `presence.influence`.

### 4.5 AI Integration Block

Every entity may include an optional `ai` block that enables LLM-driven behavior. This makes WSC **AI-native**: entities can generate dialogue, make strategic decisions, and narrate their own experiences.

#### 4.5.1 Common AI Fields (all entity types)

```json
{
  "ai": {
    "persona": "string — system prompt fragment describing personality/identity",
    "voice": {
      "tone": "formal | casual | archaic | technical | etc.",
      "vocabulary": ["array", "of", "preferred", "terms"],
      "speech_patterns": "string — quirks, catchphrases, accent notes"
    },
    "goals": ["array of current objectives in priority order"],
    "memory": ["array of event_ids this entity 'remembers'"],
    "secrets": ["array of facts known only to this entity"]
  }
}
```

#### 4.5.2 Polity AI Block (strategic reasoning)

```json
{
  "ai": {
    "persona": "The Hegemony is a proud, expansionist empire...",
    "doctrine": {
      "aggression": 0.7,
      "diplomacy": 0.4,
      "economic_focus": 0.6,
      "risk_tolerance": 0.8
    },
    "goals": ["expand_territory", "crush_rebels", "secure_trade_routes"],
    "relationships": {
      "polity.federation": { "stance": "hostile", "trust": 0.1 },
      "polity.merchants": { "stance": "neutral", "trust": 0.5 }
    },
    "voice": {
      "tone": "imperial",
      "speech_patterns": "Royal 'we', formal declarations"
    }
  }
}
```

**LLM use cases for Polities:**
* Strategic decision-making: "Given current world state, what action should we take?"
* Diplomatic dialogue: treaty negotiations, declarations of war, threats
* Internal communiqués: propaganda, edicts, laws

#### 4.5.3 Force AI Block (tactical reasoning)

```json
{
  "ai": {
    "persona": "The Iron Legion is a disciplined, elite force...",
    "commander": "agent.marshal_vex",
    "doctrine": {
      "aggression": 0.8,
      "caution": 0.3,
      "preferred_tactics": ["flanking", "siege", "shock_assault"]
    },
    "goals": ["hold_position", "await_reinforcements"],
    "morale": 0.75,
    "voice": {
      "tone": "military",
      "speech_patterns": "Terse, tactical jargon"
    }
  }
}
```

**LLM use cases for Forces:**
* Tactical assessment: "Should we engage or retreat?"
* Battle narration: describing maneuvers, casualties, turning points
* Commander dialogue: orders, rallying speeches, surrender demands

#### 4.5.4 Agent AI Block (dialogue and behavior)

```json
{
  "ai": {
    "persona": "Captain Reva is a cynical veteran who has seen too much...",
    "voice": {
      "tone": "weary",
      "vocabulary": ["old war", "back when", "you wouldn't understand"],
      "speech_patterns": "Trails off mid-sentence, sighs frequently"
    },
    "goals": ["protect_crew", "find_redemption", "avoid_authority"],
    "memory": ["evt_0042", "evt_0089", "evt_0156"],
    "secrets": ["knows location of lost artifact", "former spy"],
    "relationships": {
      "agent.kai": { "type": "mentor", "trust": 0.9 },
      "agent.voss": { "type": "rival", "trust": 0.2 }
    },
    "emotional_state": {
      "mood": "melancholic",
      "stress": 0.6,
      "loyalty_to_polity": 0.4
    }
  }
}
```

**LLM use cases for Agents:**
* Dialogue generation: conversations, interrogations, negotiations
* Decision-making: "What would this character do in this situation?"
* Internal monologue: thoughts, reflections (for narrative artifacts)
* Reaction generation: responses to events, other characters

#### 4.5.5 Locale/Site AI Block (ambient and crisis response)

```json
{
  "ai": {
    "persona": "Port Nexus is a bustling trade hub with a seedy underbelly...",
    "atmosphere": {
      "mood": "chaotic",
      "sounds": ["haggling", "ship engines", "distant alarms"],
      "smells": ["fuel", "spices", "ozone"]
    },
    "voice": {
      "tone": "noir",
      "speech_patterns": "Used for PA announcements, signage, local color"
    },
    "active_tensions": ["smuggler_crackdown", "labor_dispute"],
    "rumors": ["The governor is corrupt", "Something stirs in the lower levels"]
  }
}
```

**LLM use cases for Locales:**
* Ambient description: "Describe this place as the player enters"
* NPC generation: create throwaway characters that fit the locale
* Crisis narration: "How does this riot unfold?"
* Rumor/intel generation: procedural quest hooks

#### 4.5.6 LLM Request Context

When invoking an LLM for any entity, the system assembles a **context packet**:

```json
{
  "entity": { /* full entity with ai block */ },
  "world_context": {
    "current_tick": 1042,
    "recent_events": [ /* last N relevant events */ ],
    "nearby_entities": [ /* entities in same region/locale */ ],
    "active_conflicts": [ /* ongoing wars, disputes */ ],
    "relationships": [ /* relevant relationship edges */ ]
  },
  "situation": {
    "trigger": "dialogue_request | decision_request | narration_request",
    "prompt": "What do you say to the merchant offering a deal?",
    "constraints": {
      "max_tokens": 150,
      "temperature": 0.7,
      "must_include": ["reference to recent battle"],
      "must_avoid": ["break character", "meta references"]
    }
  }
}
```

#### 4.5.7 LLM Tiers (cost management)

| Tier | Use Case | Model Class | Latency | Cost |
|------|----------|-------------|---------|------|
| **Instant** | Combat taunts, short reactions | Small/fast | <500ms | Low |
| **Standard** | Dialogue, descriptions | Medium | 1-3s | Medium |
| **Strategic** | Polity decisions, major choices | Large/reasoning | 5-15s | High |
| **Narrative** | Chronicle prose, artifact generation | Large | 10-30s | High |

---

## 5. Lens Contract

Every lens must implement:

### 5.1 `expand(context) -> instance`

Inputs (minimum):

* `world_snapshot` (or read-only access)
* `trigger_event` or `opportunity` (what we’re drilling into)
* `constraints` (time budget, difficulty, stakes)

Outputs:

* `instance_id`
* `instance_type` (lens)
* `instance_state` (playable)
* `links` to canonical entities/events

### 5.2 `summarize(instance_result) -> {events[], world_patches[]}`

Inputs:

* final `instance_state`
* outcome metrics
* optional player trace

Outputs:

* canonical `events[]` to append
* optional `world_patches` (or rely on event effects)
* importance hints
* optional media pointers

### 5.3 Authority / Scope rules

* A lens may only assert facts within its declared scope.
* Canonical truth is updated only via Chronicle events and their effect functions.
* Lenses may create new entities (e.g., promote a Character) only via events (`character.promoted`).

### 5.4 AI Integration in Lenses

Each lens declares its AI integration points:

```typescript
interface LensAIContract {
  // What AI capabilities this lens uses
  ai_capabilities: {
    dialogue: boolean;        // Agent conversations
    strategic: boolean;       // Polity/force decisions
    tactical: boolean;        // Combat/encounter decisions
    narration: boolean;       // Event descriptions
    procedural: boolean;      // Content generation (names, details)
  };

  // AI decision points within the lens
  decision_points: DecisionPoint[];

  // How to invoke AI for this lens
  invoke_ai(request: AIRequest): Promise<AIResponse>;
}

interface DecisionPoint {
  id: string;
  entity_types: EntityType[];      // Which entities can decide here
  trigger: string;                  // When this fires
  fallback: string;                 // Non-AI behavior if LLM unavailable
  tier: 'instant' | 'standard' | 'strategic';
}
```

**Example: Scene Lens AI Decision Points**

```json
{
  "decision_points": [
    {
      "id": "dialogue_initiate",
      "entity_types": ["agent"],
      "trigger": "player_talks_to_npc",
      "fallback": "generic_greeting",
      "tier": "standard"
    },
    {
      "id": "combat_taunt",
      "entity_types": ["agent"],
      "trigger": "combat_started",
      "fallback": "silent",
      "tier": "instant"
    },
    {
      "id": "moral_choice",
      "entity_types": ["agent"],
      "trigger": "player_presents_dilemma",
      "fallback": "refuse_to_choose",
      "tier": "strategic"
    }
  ]
}
```

---

## 6. Lenses (Zoom Levels) and Their Minimal "Toy Game" Features

The purpose of toy lenses is to validate **state handoff** and **meaning preservation**, not to ship a full game. Examples below show sci-fi implementations, but the abstractions support any genre.

### 6.1 Grand Strategy Lens (macro simulation)

**Scope**: regions, polities, presence/influence, macro states (pending/active/cooldown)

**Core responsibilities**

* Maintain macro variables per (polity, region): influence, control, active states
* Tick forward in discrete steps (e.g., 1 day, 1 season)
* Generate macro opportunities: conflict risk, shortages, unrest, exploration leads

**Toy features (minimum)**

* Data: 10–50 regions, 3–6 polities
* Mechanics:

  * influence drift + simple actions: `invest`, `propaganda`, `raid`, `aid`
  * state transitions: pending → active → cooldown
  * conflict trigger when influence thresholds cross
* UI: simple 2D map (nodes) + list of opportunities

**Genre examples**

* *Sci-fi*: galactic factions vying for star systems
* *Fantasy*: kingdoms competing for provinces
* *Historical*: nations in a continental power struggle

**Key handoff tests**

* Grand Strategy emits `conflict.started` → Regional/Tactical lens expands it
* Tactical summarizes `battle.resolved` → Grand Strategy updates influence/control

**AI integration**

* Polity advisors: "Should we invest in Region X or raid Region Y?"
* Diplomatic AI: Generate treaty proposals, ultimatums, alliance offers
* Narrator: Summarize tick events ("The Hegemony's grip on the frontier weakens...")
* Procedural: Name new factions, regions, generate backstory for emergent conflicts

---

### 6.2 Regional Strategy Lens (local map + orders)

**Scope**: within one region: locales, links, forces, patrol zones

**Core responsibilities**

* Present local topology: nodes (locales/features) + edges (links)
* Allow turn-based orders that create drill-in candidates

**Toy features (minimum)**

* Map: small node graph (5–20 nodes) or hex grid
* Units: forces with `strength` and `stance` (attack/defend/patrol)
* Orders:

  * move force to node
  * blockade link
  * escort convoy/caravan
  * launch expedition
* Generates encounter seeds:

  * `skirmish.opportunity`
  * `convoy.interdiction`
  * `locale.infiltration`

**Genre examples**

* *Sci-fi*: fleet movements within a star system
* *Fantasy*: army maneuvers across a province
* *Historical*: naval operations in a theater of war

**Key handoff tests**

* Regional spawns a `convoy.interdiction` → Embodied lens expands
* Embodied outputs `cargo.seized` → Regional updates link risk/supply

**AI integration**

* Force commanders: "Marshal Vex assesses the enemy position and recommends flanking"
* Tactical narration: Describe force movements, ambushes, sieges
* Intel reports: Generate reconnaissance summaries, threat assessments
* Orders dialogue: Commander issues orders to subordinates with personality

---

### 6.3 Locale Lens (episodic place-building)

**Scope**: a locale's infrastructure, sites, crises

**Core responsibilities**

* Turn-based episode that instantiates *place* and long-lived constraints

**Toy features (minimum)**

* Grid: small 2D tile map (e.g., 40×40)
* Build actions per turn:

  * place power, housing, production, transit, defense
* Sim values:

  * power balance, housing capacity, jobs, hazard level
  * unrest changes from shortages/hazards
* Crisis cards:

  * blackout/shortage, strike/revolt, attack/siege, disaster
* Output facts:

  * infrastructure summary, site tags, updated prosperity/unrest

**Genre examples**

* *Sci-fi*: space station or colony management
* *Fantasy*: medieval city or dungeon lair building
* *Historical*: frontier town or fortress development

**Key handoff tests**

* Locale outputs `unrest.spike` → Grand Strategy lens sees polity instability
* Later Scene lens uses sites/tags to frame missions

**AI integration**

* Governor/administrator: Crisis response decisions, resource allocation reasoning
* Public announcements: PA system messages, propaganda, emergency broadcasts
* Citizen voice: Generate complaints, petitions, rumors from the populace
* Crisis narration: "The power grid failed at 0300. Riots began by dawn."

---

### 6.4 Scene / Tactical Lens (agent-scale vignette)

**Scope**: agents, small spaces, objectives, relationships

**Core responsibilities**

* Create "Paul/Luke moments" by instantiating named agents only when needed

**Toy features (minimum)**

* Turn-based grid: 10×10 to 20×20
* Units: 2–6 actors with HP-like abstraction and 1–2 abilities
* Interactions:

  * talk/persuade (skill check)
  * manipulate/hack (skill check)
  * stealth (simple detection)
  * combat (basic)
* Outcomes emitted as atomic events:

  * `agent.killed`, `agent.defected`, `holding.recovered`, `locale.sabotaged`

**Genre examples**

* *Sci-fi*: boarding action, station infiltration
* *Fantasy*: throne room intrigue, dungeon encounter
* *Historical*: assassination attempt, diplomatic negotiation

**Key handoff tests**

* Scene produces `locale.sabotaged` → Regional lens reduces locale services
* Agent promoted in a scene → persists into future scenes and chronicles

**AI integration**

* Full dialogue: Conversations, interrogations, negotiations, confessions
* NPC decisions: "What does this character do when cornered?"
* Emotional reactions: Responses to player choices, betrayals, revelations
* Procedural NPCs: Generate throwaway characters with consistent personality
* Internal monologue: Character thoughts for narrative artifacts

---

### 6.5 Embodied Action Lens (real-time action)

**Scope**: one agent encounter, seconds-to-minutes

**Core responsibilities**

* Provide visceral embodiment without full simulation complexity

**Toy features (minimum)**

* 2D arena or scrolling environment
* Agent stats: defense, health, energy/stamina
* Actions: primary attack + special; ability: dodge/power move
* Enemies: 3 archetypes (fast/weak, slow/strong, ranged)
* Objectives:

  * escape, destroy target, disable, protect convoy/VIP
* Outputs:

  * `target.destroyed`, `target.disabled`, `cargo.seized`, `escape.successful`

**Genre examples**

* *Sci-fi*: dogfight, mech battle
* *Fantasy*: duel, monster hunt
* *Historical*: chariot race, gladiatorial combat

**Key handoff tests**

* Embodied success changes macro control/influence via follow-up effects
* Embodied failure emits loss events → future availability and polity standings

**AI integration**

* Combat taunts: Quick, in-character barks ("You'll never take me alive!")
* Death/defeat speeches: Last words, surrender pleas
* Moment narration: "The pilot barrel-rolled through the debris field..."
* Procedural enemies: Generate names/personalities for memorable foes

---

## 7. State Movement: Up and Down the Zoom Stack

### 7.1 Downward (Expand)

* Select a canonical trigger (`conflict.started`, `infiltration.opportunity`)
* Gather context (entities involved + local conditions)
* Optionally instantiate detail (NPCs, districts, encounter map)
* Freeze into `instance_state`

### 7.2 Upward (Summarize)

* Translate low-level outcomes into canonical events
* Avoid leaking mechanical detail across genres
* Emit **facts that matter** at higher level:

  * control change, influence deltas
  * holding transfer
  * agent status
  * infrastructure changes

### 7.3 Temporal normalization

* World time advances in coarse ticks (e.g., day)
* Instances borrow a time slice and return a summarized result
* A lens may “consume” N world ticks based on duration/stakes

---

## 8. Importance, Retention, and Canon vs Noise

### 8.1 Importance score (0–1)

A combined function of:

* simulation impact (territory/resources)
* narrative impact (named characters, rare outcomes)
* player attention (drill-in choice, retries)
* chorus signal (optional)

### 8.2 Deferred characterization

* Most characters are latent until promoted
* Promotion is an event (`agent.promoted`) with a salience threshold
* Low-salience agents can decay (optional) to avoid "1000 tragic NPCs"

---

## 9. Chorus (Optional Streaming/Community Layer)

Goal: use audience reaction as editorial signal without overwriting canon.

**Data captured (derived)**

* message rate spikes
* sentiment curve
* meme token emergence
* poll outcomes

**Uses**

* highlight selection
* framing annotations in chronicles

Privacy: default to anonymized quotes; store aggregates first.

---

## 10. Artifact Generation

Artifacts are derived views of Chronicle + world snapshots.

### 10.1 Outputs (v0.1)

* `session_chapter.md` (events clustered by time/opportunity)
* `highlights.json` (clip candidates with timestamps)
* `timeline.json` (for UI)
* `entity_histories/` (agent arcs, polity summaries)

### 10.2 Clustering rules

* cluster by parent event chains (`causes`)
* or by time windows
* rank by importance

---

## 11. AI System Architecture

WSC is designed as an **AI-native** framework where LLM integration is a core capability, not an add-on.

### 11.1 AI Service Interface

```typescript
interface AIService {
  // Core generation methods
  generateDialogue(agent: Agent, situation: Situation): Promise<Dialogue>;
  generateDecision(entity: Entity, options: Option[]): Promise<Decision>;
  generateNarration(events: Event[], style: NarrativeStyle): Promise<string>;
  generateEntity(template: EntityTemplate, context: WorldContext): Promise<Entity>;

  // Batch operations for efficiency
  batchGenerate(requests: AIRequest[]): Promise<AIResponse[]>;

  // Configuration
  setTier(tier: 'instant' | 'standard' | 'strategic' | 'narrative'): void;
  setModel(model: string): void;
}
```

### 11.2 Context Assembly

The AI system automatically assembles rich context for each request:

```typescript
interface AIContext {
  // The entity making the request
  entity: Entity;
  entity_ai: AIBlock;

  // World state context
  world: {
    tick: number;
    active_conflicts: Conflict[];
    nearby_entities: Entity[];
    recent_events: Event[];  // Filtered by relevance to entity
  };

  // Relationship context
  relationships: {
    allies: Entity[];
    enemies: Entity[];
    known_agents: AgentRelationship[];
  };

  // Memory context (from entity.ai.memory)
  memories: Event[];  // Full event data for remembered events

  // Situation-specific context
  situation: {
    trigger: string;
    participants: Entity[];
    stakes: string;
    constraints: string[];
  };
}
```

### 11.3 Prompt Templates

Each entity type and situation has associated prompt templates:

```typescript
const AGENT_DIALOGUE_TEMPLATE = `
You are {{entity.name}}, {{entity.ai.persona}}

Voice: {{entity.ai.voice.tone}}
Speech patterns: {{entity.ai.voice.speech_patterns}}
Current goals: {{entity.ai.goals}}
Emotional state: {{entity.ai.emotional_state.mood}}

You remember these events:
{{#each memories}}
- {{this.summary}}
{{/each}}

Current situation: {{situation.trigger}}
You are speaking with: {{situation.participants}}

Respond in character. Keep response under {{constraints.max_tokens}} tokens.
`;
```

### 11.4 Caching Strategy

To manage costs and latency:

* **Persona caching**: System prompts for entities are cached and reused
* **Context windowing**: Only relevant recent events included
* **Response caching**: Identical situations can reuse responses
* **Tier routing**: Low-stakes requests use cheaper/faster models

### 11.5 Fallback Behavior

When LLM is unavailable or too slow:

```typescript
interface AIFallback {
  type: 'template' | 'silent' | 'random' | 'default';
  templates?: string[];  // Pre-written responses
  default_action?: string;  // For decision requests
}
```

---

## 12. Prototype Plan (Milestones)

### Milestone A: Canon loop

* Implement world graph + NDJSON event log
* Implement event effects for 10 event types
* Provide CLI to append event and apply effects

### Milestone B: Two-lens handoff

* Grand Strategy lens produces `conflict.started`
* Regional/Tactical lens resolves it (toy)
* Summarize back to `battle.resolved`

### Milestone C: Add embodied lens

* Regional spawns `interdiction.opportunity`
* Embodied lens resolves it
* Summarize to economic + influence effects

### Milestone D: First artifacts

* Markdown chapter generator
* Highlight candidate generator using importance

### Milestone E: AI integration (new)

* Implement AIService interface with single provider
* Add AI blocks to 2-3 test entities (1 polity, 2 agents)
* Scene lens dialogue generation
* Grand Strategy lens decision-making for AI polities
* Fallback behavior when LLM unavailable

### Milestone F: AI-driven gameplay (new)

* Full AI polity autonomy in Grand Strategy
* NPC dialogue in Scene lens
* Combat narration in Embodied lens
* Procedural entity generation (names, personalities)

---

## 13. Open Questions

* Versioning and schema migration strategy
* Determinism vs probabilistic outcomes across lenses
* How to reconcile contradictory outcomes if multiple instances overlap
* How aggressively to persist city/character detail
* LLM provider abstraction (OpenAI, Anthropic, local models)
* Cost management and rate limiting strategies
* How to handle LLM "hallucinations" that contradict world state
* Caching and context window optimization

---

## Appendix A: Example Event

```json
{
  "id": "evt_10492",
  "t_world": 1042.33,
  "t_stream": "02:14:33",
  "type": "battle.resolved",
  "where": "region.vega",
  "who": ["force.red_7", "force.blue_2", "polity.raven"],
  "data": {"winner": "force.red_7", "losses": {"red": 3, "blue": 9}},
  "causes": ["evt_10311"],
  "source": "lens.regional",
  "confidence": 0.98,
  "importance": 0.91
}
```

## Appendix B: Lens Interface (pseudo)

```ts
interface Lens {
  expand(context: ExpandContext): Instance;
  summarize(result: InstanceResult): { events: Event[]; };
}
```

## Appendix C: Example AI-Enabled Agent

```json
{
  "id": "agent.captain_reva",
  "type": "agent",
  "name": "Captain Mira Reva",
  "tags": ["veteran", "cynical", "skilled_pilot"],
  "attrs": {
    "affiliation": "polity.free_traders",
    "role": "ship_captain",
    "traits": ["pragmatic", "protective", "haunted"],
    "status": "active",
    "salience": 0.85,
    "location": "locale.port_nexus"
  },
  "ai": {
    "persona": "Captain Mira Reva is a 45-year-old veteran of the Border Wars. She lost her previous crew to a Hegemony ambush and carries deep survivor's guilt. She's fiercely protective of her current crew and distrustful of authority. Despite her cynicism, she has a soft spot for underdogs and will take risks to help those in genuine need.",
    "voice": {
      "tone": "weary",
      "vocabulary": ["back in the war", "I've seen enough", "trust is earned", "keep your head down"],
      "speech_patterns": "Speaks in short, clipped sentences. Sighs frequently. Deflects personal questions with dark humor. Softens noticeably when talking about her crew."
    },
    "goals": [
      "protect_current_crew",
      "avoid_hegemony_entanglements",
      "find_redemption_for_past_failures",
      "make_enough_credits_to_retire"
    ],
    "memory": ["evt_0042", "evt_0089", "evt_0156"],
    "secrets": [
      "Knows the location of a lost Hegemony weapons cache",
      "Former Naval Intelligence operative (defected)",
      "Still has contacts in Hegemony military"
    ],
    "relationships": {
      "agent.kai_chen": { "type": "protege", "trust": 0.95 },
      "agent.admiral_voss": { "type": "nemesis", "trust": 0.0 },
      "agent.dex": { "type": "old_friend", "trust": 0.8 }
    },
    "emotional_state": {
      "mood": "guarded",
      "stress": 0.6,
      "loyalty_to_polity": 0.3
    }
  }
}
```

## Appendix D: Example AI-Enabled Polity

```json
{
  "id": "polity.hegemony",
  "type": "polity",
  "name": "The Terran Hegemony",
  "tags": ["expansionist", "authoritarian", "militaristic"],
  "attrs": {
    "government": "military_junta",
    "ethos": "order_through_strength",
    "doctrines": ["manifest_destiny", "military_supremacy", "economic_control"],
    "resources": {
      "wealth": 0.8,
      "military": 0.9,
      "influence": 0.7
    }
  },
  "ai": {
    "persona": "The Terran Hegemony believes it is the rightful ruler of human space. It views expansion as both a right and a duty. The Hegemony's leadership is pragmatic about methods but unwavering about goals. They prefer to absorb rivals through economic pressure and diplomatic intimidation, reserving military force for when other methods fail.",
    "doctrine": {
      "aggression": 0.7,
      "diplomacy": 0.5,
      "economic_focus": 0.8,
      "risk_tolerance": 0.6,
      "preferred_methods": ["economic_pressure", "espionage", "show_of_force", "annexation"]
    },
    "goals": [
      "control_all_core_regions",
      "eliminate_free_trader_threat",
      "secure_resource_monopolies",
      "maintain_military_superiority"
    ],
    "relationships": {
      "polity.free_traders": { "stance": "hostile", "trust": 0.1 },
      "polity.merchant_league": { "stance": "wary", "trust": 0.3 },
      "polity.frontier_alliance": { "stance": "contemptuous", "trust": 0.2 }
    },
    "voice": {
      "tone": "imperial",
      "vocabulary": ["rightful authority", "order", "stability", "inevitable"],
      "speech_patterns": "Official communications use formal, legalistic language. Threats are phrased as 'opportunities for compliance.'"
    }
  }
}
```
