#!/usr/bin/env npx tsx

/**
 * check-victory.ts - Victory Condition Checker for WSC
 *
 * Evaluates victory conditions defined in scenario.json against current world state.
 * Returns structured result indicating if simulation should continue or end.
 *
 * Usage:
 *   npx tsx check-victory.ts                    # Check victory for active world
 *   npx tsx check-victory.ts --world <id>       # Check specific world
 *   npx tsx check-victory.ts --json             # Output as JSON
 *   npx tsx check-victory.ts --verbose          # Show condition evaluation details
 *
 * Exit codes:
 *   0 - No victory (continue simulation)
 *   1 - Error occurred
 *   10 - Victory achieved
 *   11 - Stalemate reached
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '../../../..');

// =============================================================================
// Types
// =============================================================================

interface VictoryCondition {
  description: string;
  condition: string;
}

interface VictoryConditions {
  [key: string]: VictoryCondition;
}

interface Scenario {
  id: string;
  name: string;
  victory_conditions?: VictoryConditions;
  starting_state?: {
    tick?: number;
  };
}

interface WorldState {
  tick: number;
  active_scenario?: string;
  simulation_status?: string;
  max_ticks?: number;
}

interface Entity {
  id: string;
  type: string;
  name: string;
  attrs: Record<string, unknown>;
}

interface CheckResult {
  continue: boolean;
  status: 'running' | 'victory' | 'stalemate' | 'error';
  condition_id?: string;
  winner?: string;
  description?: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// Argument Parsing
// =============================================================================

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const verbose = args.includes('--verbose') || args.includes('-v');
const worldIdArg = args.find((_, i) => args[i - 1] === '--world');

// =============================================================================
// Helper Functions
// =============================================================================

function log(msg: string) {
  if (!jsonOutput) {
    console.log(msg);
  }
}

function logVerbose(msg: string) {
  if (verbose && !jsonOutput) {
    console.log(`  ${msg}`);
  }
}

function loadWorldsRegistry(): { active_world: string } | null {
  const registryPath = join(ROOT_DIR, 'src/worlds/worlds.json');
  if (!existsSync(registryPath)) {
    return null;
  }
  return JSON.parse(readFileSync(registryPath, 'utf-8'));
}

function loadWorldState(worldId: string): WorldState | null {
  const statePath = join(ROOT_DIR, `src/worlds/${worldId}/state.json`);
  if (!existsSync(statePath)) {
    return null;
  }
  return JSON.parse(readFileSync(statePath, 'utf-8'));
}

function loadScenario(scenarioId: string): Scenario | null {
  const scenarioPath = join(ROOT_DIR, `src/scenarios/${scenarioId}/scenario.json`);
  if (!existsSync(scenarioPath)) {
    return null;
  }
  return JSON.parse(readFileSync(scenarioPath, 'utf-8'));
}

function loadEntities(worldId: string): Map<string, Entity> {
  const entities = new Map<string, Entity>();
  const entitiesDir = join(ROOT_DIR, `src/worlds/${worldId}/entities`);

  if (!existsSync(entitiesDir)) {
    return entities;
  }

  const files = glob.sync('*.json', { cwd: entitiesDir });
  for (const file of files) {
    try {
      const entity = JSON.parse(readFileSync(join(entitiesDir, file), 'utf-8')) as Entity;
      entities.set(entity.id, entity);
    } catch {
      // Skip invalid files
    }
  }

  return entities;
}

/**
 * Evaluate a victory condition expression against current world state
 *
 * Condition format examples:
 *   "presence.hegemony.vega.influence >= 0.9 AND presence.hegemony.vega.control == true"
 *   "force.hegemony_7th_fleet.strength < 0.3"
 *   "tick > 1500"
 *
 * Supports:
 *   - Entity attribute access: entity_id.attr_name
 *   - Comparison operators: >=, <=, >, <, ==, !=
 *   - Logical operators: AND, OR
 *   - Numeric and boolean literals
 */
function evaluateCondition(
  condition: string,
  entities: Map<string, Entity>,
  worldState: WorldState
): { result: boolean; details: Record<string, unknown> } {
  const details: Record<string, unknown> = {};

  // Handle "for N ticks" suffix (we'll track this separately later)
  const forTicksMatch = condition.match(/\s+for\s+(\d+)\s+ticks?$/i);
  let baseCondition = condition;
  if (forTicksMatch) {
    baseCondition = condition.replace(/\s+for\s+\d+\s+ticks?$/i, '').trim();
    details.requires_sustained = parseInt(forTicksMatch[1], 10);
  }

  // Split by AND/OR (simple implementation - doesn't handle nested parens)
  const andParts = baseCondition.split(/\s+AND\s+/i);
  const results: boolean[] = [];

  for (const part of andParts) {
    // Check for OR within this part
    const orParts = part.split(/\s+OR\s+/i);
    let orResult = false;

    for (const orPart of orParts) {
      const trimmed = orPart.trim();

      // Special case: "neither victory achieved" - meta condition
      if (trimmed.toLowerCase().includes('neither victory')) {
        // This is handled at a higher level
        orResult = true;
        continue;
      }

      // Parse comparison: left op right
      const compMatch = trimmed.match(/^(.+?)\s*(>=|<=|>|<|==|!=)\s*(.+)$/);
      if (!compMatch) {
        details[`parse_error_${trimmed}`] = 'Could not parse comparison';
        continue;
      }

      const [, leftExpr, op, rightExpr] = compMatch;
      const leftValue = resolveValue(leftExpr.trim(), entities, worldState, details);
      const rightValue = resolveValue(rightExpr.trim(), entities, worldState, details);

      details[leftExpr.trim()] = leftValue;

      let compResult = false;
      switch (op) {
        case '>=': compResult = Number(leftValue) >= Number(rightValue); break;
        case '<=': compResult = Number(leftValue) <= Number(rightValue); break;
        case '>': compResult = Number(leftValue) > Number(rightValue); break;
        case '<': compResult = Number(leftValue) < Number(rightValue); break;
        case '==': compResult = leftValue === rightValue || String(leftValue) === String(rightValue); break;
        case '!=': compResult = leftValue !== rightValue && String(leftValue) !== String(rightValue); break;
      }

      if (compResult) {
        orResult = true;
        break; // Short-circuit OR
      }
    }

    results.push(orResult);
  }

  // All AND parts must be true
  const finalResult = results.every(r => r);
  details.condition_met = finalResult;

  return { result: finalResult, details };
}

/**
 * Resolve a value expression to an actual value
 */
function resolveValue(
  expr: string,
  entities: Map<string, Entity>,
  worldState: WorldState,
  details: Record<string, unknown>
): unknown {
  // Numeric literal
  if (/^-?\d+(\.\d+)?$/.test(expr)) {
    return parseFloat(expr);
  }

  // Boolean literal
  if (expr === 'true') return true;
  if (expr === 'false') return false;

  // Special: tick
  if (expr === 'tick') {
    return worldState.tick;
  }

  // Entity attribute: entity_id.attr_name or entity_id.attrs.attr_name
  // Examples:
  //   presence.hegemony.vega.influence -> entity "presence.hegemony.vega", attr "influence"
  //   force.hegemony_7th_fleet.strength -> entity "force.hegemony_7th_fleet", attr "strength"

  // Find the entity by trying different splits
  // Entity IDs can have dots (e.g., presence.hegemony.vega)
  // Attribute is the last segment

  const parts = expr.split('.');
  if (parts.length < 2) {
    details[`resolve_error_${expr}`] = 'Invalid expression format';
    return null;
  }

  // Try to find entity with progressively longer prefixes
  let entity: Entity | undefined;
  let attrPath: string[] = [];

  for (let i = parts.length - 1; i >= 1; i--) {
    const candidateId = parts.slice(0, i).join('.');
    entity = entities.get(candidateId);
    if (entity) {
      attrPath = parts.slice(i);
      break;
    }
  }

  if (!entity) {
    details[`entity_not_found_${expr}`] = `Could not find entity for ${expr}`;
    return null;
  }

  // Navigate to attribute
  let value: unknown = entity.attrs;
  for (const key of attrPath) {
    if (value && typeof value === 'object' && key in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[key];
    } else {
      // Try top-level entity properties
      if (attrPath.length === 1 && key in entity) {
        value = (entity as Record<string, unknown>)[key];
      } else {
        details[`attr_not_found_${expr}`] = `Could not find attribute ${attrPath.join('.')} in ${entity.id}`;
        return null;
      }
    }
  }

  return value;
}

// =============================================================================
// Main Logic
// =============================================================================

async function main() {
  // Determine which world to check
  let worldId = worldIdArg;

  if (!worldId) {
    const registry = loadWorldsRegistry();
    if (!registry?.active_world) {
      console.error('✗ No active world. Use --world <id> or create a world first.');
      process.exit(1);
    }
    worldId = registry.active_world;
  }

  log(`\n🎯 Victory Check: ${worldId}\n`);

  // Load world state
  const worldState = loadWorldState(worldId);
  if (!worldState) {
    console.error(`✗ Could not load world state for ${worldId}`);
    process.exit(1);
  }

  // Already completed?
  if (worldState.simulation_status === 'victory' || worldState.simulation_status === 'stalemate') {
    const result: CheckResult = {
      continue: false,
      status: worldState.simulation_status as 'victory' | 'stalemate',
      description: `Simulation already ended with status: ${worldState.simulation_status}`,
    };

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      log(`Already ${worldState.simulation_status}. Simulation will not continue.`);
    }
    process.exit(worldState.simulation_status === 'victory' ? 10 : 11);
  }

  // Load scenario for victory conditions
  const scenarioId = worldState.active_scenario || 'vega_conflict';
  const scenario = loadScenario(scenarioId);

  if (!scenario) {
    console.error(`✗ Could not load scenario: ${scenarioId}`);
    process.exit(1);
  }

  if (!scenario.victory_conditions) {
    log('No victory conditions defined. Simulation continues indefinitely.');
    const result: CheckResult = { continue: true, status: 'running' };
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    }
    process.exit(0);
  }

  // Load entities
  const entities = loadEntities(worldId);
  log(`Loaded ${entities.size} entities`);
  log(`Current tick: ${worldState.tick}`);
  log('');

  // Check max ticks (stalemate)
  const maxTicks = worldState.max_ticks || scenario.victory_conditions.stalemate?.condition?.match(/tick\s*>\s*(\d+)/)?.[1];
  if (maxTicks && worldState.tick > parseInt(String(maxTicks), 10)) {
    const stalemateCondition = scenario.victory_conditions.stalemate;
    const result: CheckResult = {
      continue: false,
      status: 'stalemate',
      condition_id: 'stalemate',
      description: stalemateCondition?.description || 'Maximum ticks exceeded',
      details: { tick: worldState.tick, max_ticks: maxTicks },
    };

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      log(`🏳️ STALEMATE: ${result.description}`);
      log(`   Tick ${worldState.tick} exceeds limit of ${maxTicks}`);
    }
    process.exit(11);
  }

  // Evaluate each victory condition
  log('Checking victory conditions...\n');

  for (const [conditionId, condition] of Object.entries(scenario.victory_conditions)) {
    if (conditionId === 'stalemate') continue; // Already handled above

    logVerbose(`Evaluating: ${conditionId}`);
    logVerbose(`  Condition: ${condition.condition}`);

    const { result, details } = evaluateCondition(
      condition.condition,
      entities,
      worldState
    );

    if (verbose) {
      for (const [key, value] of Object.entries(details)) {
        logVerbose(`  ${key}: ${JSON.stringify(value)}`);
      }
    }

    if (result) {
      // Victory achieved!
      const winner = conditionId.replace('_victory', '');
      const victoryResult: CheckResult = {
        continue: false,
        status: 'victory',
        condition_id: conditionId,
        winner: `polity.${winner}`,
        description: condition.description,
        details,
      };

      if (jsonOutput) {
        console.log(JSON.stringify(victoryResult, null, 2));
      } else {
        log(`🏆 VICTORY: ${conditionId}`);
        log(`   ${condition.description}`);
        log(`   Winner: ${victoryResult.winner}`);
      }
      process.exit(10);
    } else {
      logVerbose(`  Result: NOT MET\n`);
    }
  }

  // No victory conditions met
  const continueResult: CheckResult = {
    continue: true,
    status: 'running',
    details: {
      tick: worldState.tick,
      conditions_checked: Object.keys(scenario.victory_conditions).length,
    },
  };

  if (jsonOutput) {
    console.log(JSON.stringify(continueResult, null, 2));
  } else {
    log('\n✓ No victory conditions met. Simulation continues.');
    log(`  Tick: ${worldState.tick}`);
  }
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
