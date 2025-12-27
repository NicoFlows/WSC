/**
 * Effect handlers for chronicle event types
 *
 * Each handler takes an event and world accessor, applies changes,
 * and returns a summary of what was modified.
 */

import { type ChronicleEvent, type Entity } from '../../shared/types.js';

export interface WorldAccessor {
  getEntity(id: string): Entity | null;
  saveEntity(entity: Entity): void;
  entityExists(id: string): boolean;
}

export interface EffectResult {
  modified: string[];
  created: string[];
  errors: string[];
}

export type EffectHandler = (event: ChronicleEvent, world: WorldAccessor) => EffectResult;

// =============================================================================
// Helper Functions
// =============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function extractForceIdFromLosses(key: string, who: string[]): string | null {
  // Try to match key against who list
  for (const entityId of who) {
    if (entityId.includes(key) || key.includes(entityId.split('.')[1])) {
      return entityId;
    }
  }
  // Try direct force.key
  return `force.${key}`;
}

// =============================================================================
// Conflict Handlers
// =============================================================================

const handleBattleResolved: EffectHandler = (event, world) => {
  const result: EffectResult = { modified: [], created: [], errors: [] };
  const losses = event.data.losses as Record<string, { strength_after?: number }> | undefined;

  if (!losses) {
    return result;
  }

  for (const [key, lossData] of Object.entries(losses)) {
    const forceId = extractForceIdFromLosses(key, event.who);
    if (!forceId) continue;

    const force = world.getEntity(forceId);
    if (!force) {
      result.errors.push(`Force not found: ${forceId}`);
      continue;
    }

    if (lossData.strength_after !== undefined) {
      (force.attrs as Record<string, unknown>).strength = clamp(lossData.strength_after, 0, 1);
      world.saveEntity(force);
      result.modified.push(forceId);
    }
  }

  return result;
};

const handleConflictStarted: EffectHandler = (event, world) => {
  const result: EffectResult = { modified: [], created: [], errors: [] };

  // Set presence states to at_war for involved polities in the region
  for (const entityId of event.who) {
    if (!entityId.startsWith('polity.')) continue;

    const presenceId = `presence.${entityId.split('.')[1]}.${event.where.split('.')[1]}`;
    const presence = world.getEntity(presenceId);

    if (presence) {
      const attrs = presence.attrs as Record<string, unknown>;
      const states = (attrs.states_active as string[]) || [];
      if (!states.includes('at_war')) {
        attrs.states_active = [...states, 'at_war'];
        world.saveEntity(presence);
        result.modified.push(presenceId);
      }
    }
  }

  return result;
};

const handleConflictEnded: EffectHandler = (event, world) => {
  const result: EffectResult = { modified: [], created: [], errors: [] };

  for (const entityId of event.who) {
    if (!entityId.startsWith('polity.')) continue;

    const presenceId = `presence.${entityId.split('.')[1]}.${event.where.split('.')[1]}`;
    const presence = world.getEntity(presenceId);

    if (presence) {
      const attrs = presence.attrs as Record<string, unknown>;
      const states = (attrs.states_active as string[]) || [];
      attrs.states_active = states.filter(s => s !== 'at_war');
      world.saveEntity(presence);
      result.modified.push(presenceId);
    }
  }

  return result;
};

// =============================================================================
// Influence Handlers
// =============================================================================

const handleInfluenceChanged: EffectHandler = (event, world) => {
  const result: EffectResult = { modified: [], created: [], errors: [] };
  const delta = event.data.delta as number | undefined;
  const newValue = event.data.new_value as number | undefined;

  for (const entityId of event.who) {
    if (!entityId.startsWith('presence.')) {
      // Try to construct presence ID
      const parts = entityId.split('.');
      if (parts[0] === 'polity') {
        const presenceId = `presence.${parts[1]}.${event.where.split('.')[1]}`;
        const presence = world.getEntity(presenceId);
        if (presence) {
          const attrs = presence.attrs as Record<string, unknown>;
          if (newValue !== undefined) {
            attrs.influence = clamp(newValue, 0, 1);
          } else if (delta !== undefined) {
            const current = (attrs.influence as number) || 0;
            attrs.influence = clamp(current + delta, 0, 1);
          }
          world.saveEntity(presence);
          result.modified.push(presenceId);
        }
      }
      continue;
    }

    const presence = world.getEntity(entityId);
    if (!presence) {
      result.errors.push(`Presence not found: ${entityId}`);
      continue;
    }

    const attrs = presence.attrs as Record<string, unknown>;
    if (newValue !== undefined) {
      attrs.influence = clamp(newValue, 0, 1);
    } else if (delta !== undefined) {
      const current = (attrs.influence as number) || 0;
      attrs.influence = clamp(current + delta, 0, 1);
    }
    world.saveEntity(presence);
    result.modified.push(entityId);
  }

  return result;
};

const handleControlChanged: EffectHandler = (event, world) => {
  const result: EffectResult = { modified: [], created: [], errors: [] };
  const newController = event.data.new_controller as string | undefined;

  // Update region or locale ownership
  const location = world.getEntity(event.where);
  if (location && newController) {
    const attrs = location.attrs as Record<string, unknown>;
    attrs.owner_polity_id = newController;
    world.saveEntity(location);
    result.modified.push(event.where);
  }

  return result;
};

// =============================================================================
// Agent Handlers
// =============================================================================

const handleAgentKilled: EffectHandler = (event, world) => {
  const result: EffectResult = { modified: [], created: [], errors: [] };

  for (const entityId of event.who) {
    if (!entityId.startsWith('agent.')) continue;

    const agent = world.getEntity(entityId);
    if (!agent) {
      result.errors.push(`Agent not found: ${entityId}`);
      continue;
    }

    const attrs = agent.attrs as Record<string, unknown>;
    attrs.status = 'dead';
    attrs.salience = 0;
    world.saveEntity(agent);
    result.modified.push(entityId);
  }

  return result;
};

const handleAgentPromoted: EffectHandler = (event, world) => {
  const result: EffectResult = { modified: [], created: [], errors: [] };
  const newRole = event.data.new_role as string | undefined;

  for (const entityId of event.who) {
    if (!entityId.startsWith('agent.')) continue;

    const agent = world.getEntity(entityId);
    if (!agent) {
      result.errors.push(`Agent not found: ${entityId}`);
      continue;
    }

    if (newRole) {
      const attrs = agent.attrs as Record<string, unknown>;
      attrs.role = newRole;
      world.saveEntity(agent);
      result.modified.push(entityId);
    }
  }

  return result;
};

const handleAgentDefected: EffectHandler = (event, world) => {
  const result: EffectResult = { modified: [], created: [], errors: [] };
  const newAffiliation = event.data.new_affiliation as string | undefined;

  for (const entityId of event.who) {
    if (!entityId.startsWith('agent.')) continue;

    const agent = world.getEntity(entityId);
    if (!agent) {
      result.errors.push(`Agent not found: ${entityId}`);
      continue;
    }

    if (newAffiliation) {
      const attrs = agent.attrs as Record<string, unknown>;
      attrs.affiliation = newAffiliation;
      world.saveEntity(agent);
      result.modified.push(entityId);
    }
  }

  return result;
};

// =============================================================================
// Settlement Handlers
// =============================================================================

const handleInfrastructureCompleted: EffectHandler = (event, world) => {
  const result: EffectResult = { modified: [], created: [], errors: [] };
  const infraType = event.data.infrastructure_type as string | undefined;
  const level = event.data.level as number | undefined;

  const site = world.getEntity(event.where);
  if (!site) {
    result.errors.push(`Site not found: ${event.where}`);
    return result;
  }

  if (infraType) {
    const attrs = site.attrs as Record<string, unknown>;
    const infra = (attrs.infrastructure as Record<string, number>) || {};
    infra[infraType] = level ?? 1;
    attrs.infrastructure = infra;
    world.saveEntity(site);
    result.modified.push(event.where);
  }

  return result;
};

const handleUnrestSpike: EffectHandler = (event, world) => {
  const result: EffectResult = { modified: [], created: [], errors: [] };
  const delta = event.data.delta as number | undefined;
  const newValue = event.data.new_value as number | undefined;

  const site = world.getEntity(event.where);
  if (!site) {
    result.errors.push(`Site not found: ${event.where}`);
    return result;
  }

  const attrs = site.attrs as Record<string, unknown>;
  if (newValue !== undefined) {
    attrs.unrest = clamp(newValue, 0, 1);
  } else if (delta !== undefined) {
    const current = (attrs.unrest as number) || 0;
    attrs.unrest = clamp(current + delta, 0, 1);
  }
  world.saveEntity(site);
  result.modified.push(event.where);

  return result;
};

// =============================================================================
// Handler Registry
// =============================================================================

export const handlers: Record<string, EffectHandler> = {
  // Conflict
  'battle.resolved': handleBattleResolved,
  'conflict.started': handleConflictStarted,
  'conflict.ended': handleConflictEnded,

  // Influence
  'influence.changed': handleInfluenceChanged,
  'control.changed': handleControlChanged,

  // Agent
  'agent.killed': handleAgentKilled,
  'agent.promoted': handleAgentPromoted,
  'agent.defected': handleAgentDefected,

  // Settlement
  'infrastructure.completed': handleInfrastructureCompleted,
  'unrest.spike': handleUnrestSpike,
};

export function getHandler(eventType: string): EffectHandler | null {
  return handlers[eventType] || null;
}

export function listHandlers(): string[] {
  return Object.keys(handlers).sort();
}
