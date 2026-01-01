import { z } from 'zod';

// =============================================================================
// Common Schemas
// =============================================================================

// Entity ID format: type.slug or type.slug.subslug (for presence, site, link)
export const EntityIdSchema = z.string().regex(/^[a-z_]+\.[a-z0-9_.]+$/);

export const TagsSchema = z.array(z.string()).default([]);

// =============================================================================
// AI Integration Block (shared across all entities)
// =============================================================================

export const VoiceSchema = z.object({
  tone: z.string(),
  vocabulary: z.array(z.string()).optional(),
  speech_patterns: z.string().optional(),
}).partial();

export const EmotionalStateSchema = z.object({
  mood: z.string(),
  stress: z.number().min(0).max(1).optional(),
  hope: z.number().min(0).max(1).optional(),
  loyalty_to_polity: z.number().min(0).max(1).optional(),
  loyalty_to_crew: z.number().min(0).max(1).optional(),
  anger: z.number().min(0).max(1).optional(),
  guilt: z.number().min(0).max(1).optional(),
}).partial();

export const AIBlockSchema = z.object({
  persona: z.string().optional(),
  voice: VoiceSchema.optional(),
  goals: z.array(z.string()).optional(),
  memory: z.array(z.string()).optional(),
  secrets: z.array(z.string()).optional(),
  emotional_state: EmotionalStateSchema.optional(),
  skills: z.record(z.number().min(0).max(1)).optional(),
  quirks: z.array(z.string()).optional(),
  doctrine: z.record(z.any()).optional(),
}).partial();

// =============================================================================
// Entity Types
// =============================================================================

export const EntityTypes = [
  'polity',
  'region',
  'presence',
  'force',
  'locale',
  'feature',
  'link',
  'site',
  'agent',
  'holding',
] as const;

export type EntityType = typeof EntityTypes[number];

// Base entity schema (shared fields)
const BaseEntitySchema = z.object({
  id: EntityIdSchema,
  type: z.enum(EntityTypes),
  name: z.string(),
  tags: TagsSchema,
  attrs: z.record(z.any()),
  ai: AIBlockSchema.optional(),
});

// Type-specific entity schemas
export const PolitySchema = BaseEntitySchema.extend({
  type: z.literal('polity'),
  attrs: z.object({
    allegiance: z.string().nullable().optional(),
    government: z.string().optional(),
    ethos: z.string().optional(),
    doctrines: z.array(z.string()).optional(),
    resources: z.record(z.any()).optional(),
  }).passthrough(),
});

export const RegionSchema = BaseEntitySchema.extend({
  type: z.literal('region'),
  attrs: z.object({
    coords: z.any().optional(),
    security: z.number().min(0).max(1).optional(),
    economy: z.number().min(0).max(1).optional(),
    population: z.number().optional(),
    hazards: z.array(z.string()).optional(),
    terrain: z.string().optional(),
  }).passthrough(),
});

export const PresenceSchema = BaseEntitySchema.extend({
  type: z.literal('presence'),
  attrs: z.object({
    polity_id: z.string(),
    region_id: z.string(),
    influence: z.number().min(0).max(1),
    control: z.boolean().optional(),
    states_active: z.array(z.string()).optional(),
    states_pending: z.array(z.string()).optional(),
    states_cooldown: z.array(z.string()).optional(),
  }).passthrough(),
});

export const ForceSchema = BaseEntitySchema.extend({
  type: z.literal('force'),
  attrs: z.object({
    polity_id: z.string(),
    strength: z.number().min(0).max(1),
    composition: z.record(z.any()).optional(),
    location: z.string(),
    stance: z.string().optional(),
  }).passthrough(),
});

export const LocaleSchema = BaseEntitySchema.extend({
  type: z.literal('locale'),
  attrs: z.object({
    region_id: z.string(),
    owner_polity_id: z.string().optional(),
    services: z.array(z.string()).optional(),
    security_level: z.number().min(0).max(1).optional(),
    locale_type: z.string().optional(),
  }).passthrough(),
});

export const FeatureSchema = BaseEntitySchema.extend({
  type: z.literal('feature'),
  attrs: z.object({
    region_id: z.string(),
    kind: z.string(),
    properties: z.record(z.any()).optional(),
  }).passthrough(),
});

export const LinkSchema = BaseEntitySchema.extend({
  type: z.literal('link'),
  attrs: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    endpoints: z.array(z.string()).optional(),  // Alternative format used in examples
    kind: z.string().optional(),
    capacity: z.number().optional(),
    risk: z.number().min(0).max(1).optional(),
    bidirectional: z.boolean().optional(),
  }).passthrough(),
});

export const SiteSchema = BaseEntitySchema.extend({
  type: z.literal('site'),
  attrs: z.object({
    locale_id: z.string(),
    owner_polity_id: z.string().optional(),
    population: z.number().optional(),
    prosperity: z.number().min(0).max(1).optional(),
    unrest: z.number().min(0).max(1).optional(),
    hazard: z.number().min(0).max(1).optional(),
    infrastructure: z.record(z.any()).optional(),
  }).passthrough(),
});

export const AgentSchema = BaseEntitySchema.extend({
  type: z.literal('agent'),
  attrs: z.object({
    affiliation: z.string().nullable().optional(),
    role: z.string().optional(),
    traits: z.array(z.string()).optional(),
    relationships: z.record(z.any()).optional(),
    status: z.string().optional(),
    salience: z.number().min(0).max(1).optional(),
    location: z.string().optional(),
  }).passthrough(),
});

export const HoldingSchema = BaseEntitySchema.extend({
  type: z.literal('holding'),
  attrs: z.object({
    owner_id: z.string().optional(),
    owner: z.string().optional(),  // Alternative field used in examples
    holding_type: z.string().optional(),
    properties: z.record(z.any()).optional(),
    location: z.string().optional(),
  }).passthrough(),
});

// Union of all entity schemas
export const EntitySchema = z.discriminatedUnion('type', [
  PolitySchema,
  RegionSchema,
  PresenceSchema,
  ForceSchema,
  LocaleSchema,
  FeatureSchema,
  LinkSchema,
  SiteSchema,
  AgentSchema,
  HoldingSchema,
]);

export type Entity = z.infer<typeof EntitySchema>;

// =============================================================================
// Chronicle Event Schema
// =============================================================================

export const EventTypeSchema = z.string().regex(/^[a-z_]+\.[a-z_]+$/);

/**
 * Simulation scales - each operates at different timescales
 * Events are tagged with their source scale for proper temporal organization
 */
export const SimulationScales = [
  'galactic',      // galactic-4x: days to weeks
  'continental',   // continental-strategy: seasons to years
  'city',          // city-builder: weeks to months
  'scene',         // party-rpg: minutes to hours
  'action',        // action-sim: seconds to minutes
] as const;

export type SimulationScale = typeof SimulationScales[number];

export const SimulationScaleSchema = z.enum(SimulationScales);

/**
 * Hierarchical time context for chronicle events
 *
 * t_world: The parent tick at the top simulation level (integer)
 * t_scale: Which simulation scale generated this event
 * t_local: Local time within the current scale's context (optional)
 * t_parent: Event ID that triggered this drill-down (for sub-scale events)
 * t_depth: How many levels deep this event is (0 = top level)
 *
 * Example flow:
 * - galactic-4x tick 1000 creates opportunity evt_10500
 * - party-rpg resolves scene, emits evt_10501 with:
 *   { t_world: 1000, t_scale: "scene", t_local: 15.5, t_parent: "evt_10500", t_depth: 1 }
 * - action-sim resolves combat within scene, emits evt_10502 with:
 *   { t_world: 1000, t_scale: "action", t_local: 47.2, t_parent: "evt_10501", t_depth: 2 }
 */
export const ChronicleEventSchema = z.object({
  // Event identity
  id: z.string().regex(/^evt_\d+$/),

  // Hierarchical time
  t_world: z.number(),                              // Parent tick (integer for top-level, preserved for drill-downs)
  t_scale: SimulationScaleSchema.optional(),        // Which scale generated this event
  t_local: z.number().optional(),                   // Local time within current scale
  t_parent: z.string().optional(),                  // Parent event ID (for drill-down events)
  t_depth: z.number().int().min(0).optional(),      // Nesting depth (0 = top level)

  // Legacy/optional time
  t_stream: z.string().optional(),                  // Media alignment timestamp

  // Event content
  type: EventTypeSchema,
  where: EntityIdSchema,
  who: z.array(EntityIdSchema),
  data: z.record(z.any()),

  // Causal chain
  causes: z.array(z.string()).optional(),

  // Metadata
  source: z.string().optional(),                    // Which agent/lens generated this
  confidence: z.number().min(0).max(1).optional(),
  importance: z.number().min(0).max(1).optional(),
  narrative_summary: z.string().optional(),
});

export type ChronicleEvent = z.infer<typeof ChronicleEventSchema>;

// =============================================================================
// World State Schema
// =============================================================================

export const DrillDownOpportunitySchema = z.object({
  id: z.string(),
  event_id: z.string(),
  type: z.string(),
  description: z.string(),
  importance: z.number().min(0).max(1),
  suggested_agent: z.string(),
  suggested_scale: SimulationScaleSchema.optional(),  // What scale to drill down to
  expires_at_tick: z.number().optional(),
  context: z.record(z.any()).optional(),
});

/**
 * Tracks an active drill-down session
 * When we zoom into a lower scale, this tracks the context so we can return
 */
export const ActiveDrillDownSchema = z.object({
  id: z.string(),
  parent_event_id: z.string(),          // Event that triggered this drill-down
  parent_scale: SimulationScaleSchema,   // Scale we came from
  current_scale: SimulationScaleSchema,  // Scale we're currently at
  current_depth: z.number().int().min(1),
  started_at_tick: z.number(),
  local_tick: z.number().optional(),     // Local time within this scale
  context: z.record(z.any()).optional(), // Preserved context from parent
});

export const ActiveConflictSchema = z.object({
  id: z.string(),
  type: z.string(),
  parties: z.array(z.string()),
  location: z.string(),
  started_at_tick: z.number(),
  intensity: z.number().min(0).max(1),
});

/**
 * Simulation status - controls whether the simulation continues or stops
 */
export const SimulationStatuses = [
  'running',    // Simulation is active, continue processing ticks
  'paused',     // Temporarily stopped, can resume
  'victory',    // A victory condition was met
  'stalemate',  // Stalemate condition met (e.g., max ticks exceeded)
  'error',      // Simulation stopped due to error
] as const;

export type SimulationStatus = typeof SimulationStatuses[number];

export const SimulationStatusSchema = z.enum(SimulationStatuses);

/**
 * Records when and how the simulation ended
 */
export const VictoryRecordSchema = z.object({
  condition_id: z.string(),           // e.g., "hegemony_victory", "free_trader_victory", "stalemate"
  winner: z.string().optional(),       // Polity ID of the winner (if applicable)
  description: z.string(),             // Human-readable description
  achieved_at_tick: z.number(),        // When victory was achieved
  final_state: z.record(z.any()).optional(),  // Snapshot of key metrics at victory
});

export type VictoryRecord = z.infer<typeof VictoryRecordSchema>;

export const WorldStateSchema = z.object({
  tick: z.number(),
  last_event_id: z.number(),
  active_scenario: z.string().optional(),

  // Simulation lifecycle
  simulation_status: SimulationStatusSchema.default('running'),
  victory: VictoryRecordSchema.optional(),
  max_ticks: z.number().optional(),    // Optional tick limit for auto-stalemate

  // Hierarchical simulation state
  current_scale: SimulationScaleSchema.optional(),   // What scale we're currently simulating
  active_drill_downs: z.array(ActiveDrillDownSchema).optional(),  // Stack of active drill-downs

  drill_down_opportunities: z.array(DrillDownOpportunitySchema).optional(),
  active_conflicts: z.array(ActiveConflictSchema).optional(),
  created_at: z.string(),
  updated_at: z.string(),
  settings: z.object({
    genre: z.string().optional(),
    name: z.string().optional(),
  }).passthrough().optional(),
});

export type DrillDownOpportunity = z.infer<typeof DrillDownOpportunitySchema>;
export type ActiveConflict = z.infer<typeof ActiveConflictSchema>;
export type ActiveDrillDown = z.infer<typeof ActiveDrillDownSchema>;
export type WorldState = z.infer<typeof WorldStateSchema>;

// =============================================================================
// Helper Types
// =============================================================================

export interface QueryOptions {
  type?: EntityType;
  tags?: string[];
  belongsTo?: string;
  location?: string;
  limit?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
