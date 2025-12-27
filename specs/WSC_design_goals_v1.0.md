# World State Chronicler (WSC)

## Design Goals & Conceptual Preamble

### Purpose

The **World State Chronicler (WSC)** is a unified simulation and narrative framework designed to support a **single persistent world** that can be experienced through **multiple gameplay genres and levels of abstraction**, while automatically producing **meaningful historical and narrative artifacts** (chronicles, highlights, maps, summaries) with minimal manual effort.

The goal is to enable *epic continuity*—the kind seen in **Dune**, **Star Wars**, or long-running tabletop campaigns—where galaxy-scale political, economic, and military forces coexist with intimate, character-driven moments, and where both scales meaningfully inform one another.

WSC is **not** a universal game engine.
It is a **canonical world state + event history system** that different gameplay “lenses” can plug into.

---

## Core Inspirations

* **Elite Dangerous – Background Simulation (BGS)**
  A large-scale, persistent simulation of factions, influence, and system states that evolves over time based on player actions, but lacks deep human-scale narrative instantiation.

* **Microscope (Tabletop RPG)**
  A zoomable historical storytelling framework where eras, events, and scenes are created only when needed, and specificity is deferred until participants choose to drill in.

* **Strategy Games, City Builders, RPGs, Space Sims**
  Each excels at a different narrative scale, but traditionally exists in isolation.

* **Streaming & Community Culture (Twitch, long-form RPG streams)**
  Demonstrates that audience reaction (“the chorus”) shapes how events are remembered and which moments become culturally significant.

---

## High-Level Concept

WSC is built around four foundational components:

### 1. Canonical World State

A persistent, engine-agnostic representation of the current truth of the world:

* entities organized in a generic hierarchy:
  * **Polities** (factions, nations, guilds, corporations)
  * **Regions** (star systems, provinces, kingdoms, zones)
  * **Locales** (stations, cities, dungeons, bases)
  * **Agents** (characters, leaders, heroes, units)
  * **Holdings** (assets, artifacts, resources, territory)
* relationships between entities
* long-lived facts and conditions

The entity model is deliberately genre-agnostic: a "Region" might be a star system in a space game, a province in a strategy game, or a kingdom in a fantasy setting.

The world state answers: **"What is true right now?"**

---

### 2. World State Chronicle (Event Log)

An append-only historical record maintained by the **World State Chronicler**:

* conflicts, discoveries, political shifts
* character-level outcomes
* infrastructure and settlement changes

The chronicle answers: **“What happened, and when?”**

This event log is the authoritative source for:

* timelines
* campaign histories
* artifact generation

---

### 3. Gameplay Lenses (Zoomable Resolution Layers)

Each gameplay mode is a **lens** that:

* *expands* a portion of the world state into a playable instance
* grants player or AI authority at a specific resolution
* *summarizes* outcomes back into canonical events and world updates via the Chronicler

Lenses do not share mechanics; they share **semantic facts and events**.

---

### 4. Artifact & Chronicle Outputs

Artifacts are **derived products**, not canonical truth:

* written chronicles / “history tomes”
* highlight reels and clip manifests
* maps showing world evolution
* character arc summaries
* session or season recaps

Artifacts are generated from:

* the world state
* the chronicle
* importance signals
* optional community (“chorus”) data

---

## Zoom & Resolution Philosophy

Zooming is **not a camera operation**.
Zooming is a **transfer of authority and resolution**.

* High-level zoom:

  * large time steps
  * abstract outcomes
  * intent-driven decisions

* Low-level zoom:

  * fine-grained or real-time action
  * player skill and choice matter
  * ambiguity collapses into specific events and characters

Each lens operates under a **resolution contract**:

* what inputs it consumes
* what outputs it must produce
* what facts it is allowed to assert via the World State Chronicler

---

## Canonical Zoom Stack (Initial Targets)

This is a prototype ladder, not a fixed scope:

1. **Grand Strategy Lens** (formerly Galaxy / BGS)

   * Turn-based or tick-based
   * Polities, influence, regions, resources
   * Produces macro events (wars, shortages, unrest)
   * *Examples: galactic factions, feudal kingdoms, corporate territories*

2. **Regional Strategy Lens** (formerly System / Planetary)

   * Turn-based, map-driven
   * Forces, locales, routes, control points
   * Determines which situations are candidates for deeper zoom
   * *Examples: star system operations, provincial campaigns, dungeon regions*

3. **Locale Lens** (formerly Settlement / City Builder)

   * Episodic, bounded locale-scale simulation
   * Infrastructure, zones, crises
   * Produces long-lived place-based facts
   * Acts as a narrative anchor for later scenes
   * *Examples: space station, medieval city, frontier outpost, megadungeon level*

4. **Scene / Tactical Lens**

   * Turn-based grid or node-based encounters
   * Agents, dialogue, moral decisions
   * Where personal "Paul / Luke" moments emerge
   * *Examples: boarding action, throne room intrigue, dungeon encounter*

5. **Embodied Action Lens** (formerly Pilot)

   * Simplified real-time (e.g., 2D action)
   * Visceral embodiment without full simulation complexity
   * Produces concrete micro-events (kills, escapes, sabotage)
   * *Examples: dogfight, duel, chase sequence, heist*

Not all runs or events require all lenses.

---

## Deferred Characterization

Characters are **not fully instantiated by default**.

* Most individuals exist as abstract roles or probabilities
* Characters gain names, personality, and memory only when:

  * a player drills into a scene
  * narrative importance crosses a threshold
  * explanation at human scale is required

This avoids “cardboard NPCs” while supporting epic scope.

---

## Importance as a First-Class Concept

Each event may carry an **importance score**, derived from:

* simulation impact (territory, resources, control)
* narrative impact (named characters, rare outcomes)
* player attention (drill-ins, retries, focus)
* community reaction (sentiment spikes, meme emergence)

Importance influences:

* artifact selection
* highlight generation
* what is remembered in detail vs summarized away

---

## The Chorus (Community Signal Layer)

Audience reaction is treated as a **non-authoritative narrative signal**:

* sentiment curves
* reaction spikes
* recurring phrases or memes

The chorus:

* informs artifact framing
* helps identify meaningful moments
* does **not** overwrite canonical world state

It functions like commentary, not history.

---

## Artifacts vs Save Files

A save file preserves **state for continuation**.
The World State Chronicler preserves **history for meaning**.

A completed run should leave behind:

* a readable history
* memorable moments
* maps and diagrams
* a sense of cultural memory

Streaming is treated as a manual precursor to this idea; WSC aims to automate the structural work while preserving creator control.

---

## Technical Philosophy

* **Semantic over mechanical sharing**
* **Event-sourced history**
* **Lens-agnostic core**
* **Minimalist prototypes first**
* **Renderer flexibility (2D-first, 3D-capable later)**
* **AI-native design** (LLM integration at every scale)

---

## AI-Native Architecture

WSC is designed to be **AI-native**: LLM integration is a first-class concern at every zoom level, not an afterthought.

### LLM Integration Points

Every entity and lens can hook into LLMs for:

* **Dialogue generation** — Agents speak in character, informed by traits, relationships, and history
* **Strategic reasoning** — Polities and forces make decisions based on goals, doctrine, and world state
* **Narrative synthesis** — Chronicle events are transformed into prose, summaries, and artifacts
* **Procedural expansion** — When drilling into detail, LLMs instantiate names, personalities, and context

### Per-Scale AI Roles

| Scale | AI Role | Examples |
|-------|---------|----------|
| **Grand Strategy** | Polity advisors, diplomatic reasoning | "Should we declare war?" / Treaty negotiations |
| **Regional** | Force commanders, tactical assessment | "Where should we deploy?" / Threat analysis |
| **Locale** | Governors, crisis responders | "How do we handle the riot?" / Resource allocation |
| **Scene/Tactical** | Agent dialogue, NPC behavior | Conversations, persuasion, betrayal |
| **Embodied** | Combat taunts, moment narration | "You'll never escape!" / Death speeches |

### Entity LLM Hooks

Entities carry optional fields that enable LLM integration:

* `persona` — personality template or system prompt fragment
* `voice` — speech patterns, vocabulary, tone
* `goals` — what this entity wants (informs strategic LLM calls)
* `memory` — key events this entity "remembers" (context for dialogue)
* `doctrine` — behavioral rules for strategic decision-making

### Design Principles for AI Integration

1. **Context is king** — LLM calls receive rich context from world state and chronicle
2. **Cacheable prompts** — Persona/voice templates are stable; only situation varies
3. **Graceful degradation** — Systems work without LLM (fallback to simple logic)
4. **Human override** — Player can always override AI suggestions
5. **Cost-aware** — Different tiers of LLM calls (cheap/fast for taunts, expensive for strategy)

---

## What WSC Is Not

* Not a metaverse
* Not a universal physics engine
* Not a monolithic game
* Not a replacement for authored narrative

WSC is a **continuity and memory framework**.

---

## Immediate Design Goal

Establish a minimal, working **World State Chronicler loop**:

1. World state snapshot
2. Event emission via one lens
3. Chronicle append
4. World state update
5. Artifact generation (even if crude)

All further complexity builds on this loop.

---

If you want, next steps could be:

* updating your existing `docs/preamble.md` verbatim with this text
* generating a **short “coding agent context” version**
* or aligning file names, namespaces, and APIs (`chronicler.emit`, `chronicler.snapshot`) with this terminology

Just tell me how you want to use it next.
