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

export const ChronicleEventSchema = z.object({
  id: z.string().regex(/^evt_\d+$/),
  t_world: z.number(),
  t_stream: z.string().optional(),
  type: EventTypeSchema,
  where: EntityIdSchema,
  who: z.array(EntityIdSchema),
  data: z.record(z.any()),
  causes: z.array(z.string()).optional(),
  source: z.string().optional(),
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
  expires_at_tick: z.number().optional(),
  context: z.record(z.any()).optional(),
});

export const ActiveConflictSchema = z.object({
  id: z.string(),
  type: z.string(),
  parties: z.array(z.string()),
  location: z.string(),
  started_at_tick: z.number(),
  intensity: z.number().min(0).max(1),
});

export const WorldStateSchema = z.object({
  tick: z.number(),
  last_event_id: z.number(),
  active_scenario: z.string().optional(),
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
