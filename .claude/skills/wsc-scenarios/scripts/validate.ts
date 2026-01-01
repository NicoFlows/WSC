#!/usr/bin/env npx tsx

/**
 * Validate a WSC scenario for completeness and consistency
 *
 * Usage:
 *   npx tsx validate.ts --scenario vega_conflict
 *   npx tsx validate.ts --scenario vega_conflict --verbose
 *   npx tsx validate.ts --scenario vega_conflict --fix  # Auto-fix some issues
 *   npx tsx validate.ts --list                          # List all scenarios
 */

import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  getScenariosDir,
  getScenarioDir,
  readJson,
  formatSuccess,
  formatError,
  formatWarning,
} from '../../shared/utils.js';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

interface ScenarioConfig {
  id: string;
  name: string;
  setting?: {
    genre?: string;
  };
  factions?: Record<string, unknown>;
  entities?: {
    polities?: string[];
    regions?: string[];
    forces?: string[];
    agents?: string[];
    locales?: string[];
  };
  victory_conditions?: Record<string, {
    condition?: string;
    description?: string;
  }>;
}

interface Entity {
  id: string;
  type: string;
  name: string;
  attrs?: Record<string, unknown>;
}

interface LocationFile {
  id: string;
  name: string;
  hierarchy?: {
    parent?: {
      location_id?: string;
    };
    children?: Array<{
      location_id?: string;
    }>;
  };
  entity_id?: string;
}

interface ValidateOptions {
  scenario?: string;
  verbose?: boolean;
  fix?: boolean;
  list?: boolean;
}

function parseArgs(): ValidateOptions {
  const args = process.argv.slice(2);
  const options: ValidateOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--scenario':
        if (next) { options.scenario = next; i++; }
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--fix':
        options.fix = true;
        break;
      case '--list':
        options.list = true;
        break;
    }
  }

  return options;
}

function listScenarios(): void {
  const scenariosDir = getScenariosDir();
  if (!existsSync(scenariosDir)) {
    console.log(formatWarning('No scenarios directory found'));
    return;
  }

  const dirs = readdirSync(scenariosDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => d.name);

  console.log('\nAvailable Scenarios:');
  console.log('='.repeat(40));

  for (const dir of dirs) {
    const configPath = join(scenariosDir, dir, 'scenario.json');
    if (existsSync(configPath)) {
      try {
        const config = readJson<ScenarioConfig>(configPath);
        console.log(`\n  ${dir}`);
        console.log(`    Name: ${config.name || 'Unnamed'}`);
        console.log(`    Genre: ${config.setting?.genre || 'Unknown'}`);
      } catch {
        console.log(`\n  ${dir} (invalid config)`);
      }
    } else {
      console.log(`\n  ${dir} (missing scenario.json)`);
    }
  }
  console.log('');
}

function loadEntities(scenarioDir: string): Map<string, Entity> {
  const entitiesDir = join(scenarioDir, 'entities');
  const entities = new Map<string, Entity>();

  if (!existsSync(entitiesDir)) {
    return entities;
  }

  const files = readdirSync(entitiesDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const entity = readJson<Entity>(join(entitiesDir, file));
      if (entity.id) {
        entities.set(entity.id, entity);
      }
    } catch {
      // Skip invalid files
    }
  }

  return entities;
}

function loadLocations(scenarioDir: string): Map<string, LocationFile> {
  const locationsDir = join(scenarioDir, 'locations');
  const locations = new Map<string, LocationFile>();

  if (!existsSync(locationsDir)) {
    return locations;
  }

  const files = readdirSync(locationsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const location = readJson<LocationFile>(join(locationsDir, file));
      if (location.id) {
        locations.set(location.id, location);
      }
    } catch {
      // Skip invalid files
    }
  }

  return locations;
}

function validateScenario(scenarioId: string, verbose: boolean): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  const scenarioDir = getScenarioDir(scenarioId);

  // Check scenario directory exists
  if (!existsSync(scenarioDir)) {
    result.errors.push(`Scenario directory not found: ${scenarioDir}`);
    result.valid = false;
    return result;
  }

  // Check scenario.json exists
  const configPath = join(scenarioDir, 'scenario.json');
  if (!existsSync(configPath)) {
    result.errors.push('Missing scenario.json');
    result.valid = false;
    return result;
  }

  let config: ScenarioConfig;
  try {
    config = readJson<ScenarioConfig>(configPath);
  } catch (err) {
    result.errors.push(`Invalid scenario.json: ${(err as Error).message}`);
    result.valid = false;
    return result;
  }

  result.info.push(`Scenario: ${config.name || scenarioId}`);

  // Load entities and locations
  const entities = loadEntities(scenarioDir);
  const locations = loadLocations(scenarioDir);

  result.info.push(`Entities: ${entities.size}`);
  result.info.push(`Locations: ${locations.size}`);

  // === REQUIRED CHECKS ===

  // Check for polities (at least 2)
  const polities = Array.from(entities.values()).filter(e => e.type === 'polity');
  if (polities.length < 2) {
    result.errors.push(`Need at least 2 polities, found ${polities.length}`);
    result.valid = false;
  } else {
    result.info.push(`Polities: ${polities.length}`);
  }

  // Check for regions (at least 1)
  const regions = Array.from(entities.values()).filter(e => e.type === 'region');
  if (regions.length < 1) {
    result.errors.push('Need at least 1 region');
    result.valid = false;
  } else {
    result.info.push(`Regions: ${regions.length}`);
  }

  // Check for presence entities
  const presences = Array.from(entities.values()).filter(e => e.type === 'presence');
  if (presences.length < 1) {
    result.warnings.push('No presence entities found - polities have no territorial control');
  } else {
    result.info.push(`Presences: ${presences.length}`);
  }

  // Check for forces
  const forces = Array.from(entities.values()).filter(e => e.type === 'force');
  if (forces.length < 1) {
    result.warnings.push('No force entities found - no military units for simulation');
  } else {
    result.info.push(`Forces: ${forces.length}`);
  }

  // Check for agents
  const agents = Array.from(entities.values()).filter(e => e.type === 'agent');
  if (agents.length < 1) {
    result.warnings.push('No agent entities found - no characters for RPG scenes');
  } else {
    result.info.push(`Agents: ${agents.length}`);
  }

  // === REFERENCE INTEGRITY ===

  // Check entity references
  const entityIds = new Set(entities.keys());

  for (const [id, entity] of entities) {
    const attrs = entity.attrs || {};

    // Check polity_id references
    if (attrs.polity_id && typeof attrs.polity_id === 'string') {
      if (!entityIds.has(attrs.polity_id)) {
        result.errors.push(`${id}: references non-existent polity '${attrs.polity_id}'`);
        result.valid = false;
      }
    }

    // Check region_id references
    if (attrs.region_id && typeof attrs.region_id === 'string') {
      if (!entityIds.has(attrs.region_id)) {
        result.errors.push(`${id}: references non-existent region '${attrs.region_id}'`);
        result.valid = false;
      }
    }

    // Check locale_id references
    if (attrs.locale_id && typeof attrs.locale_id === 'string') {
      if (!entityIds.has(attrs.locale_id)) {
        result.errors.push(`${id}: references non-existent locale '${attrs.locale_id}'`);
        result.valid = false;
      }
    }

    // Check affiliation references
    if (attrs.affiliation && typeof attrs.affiliation === 'string') {
      if (!entityIds.has(attrs.affiliation)) {
        result.errors.push(`${id}: references non-existent affiliation '${attrs.affiliation}'`);
        result.valid = false;
      }
    }

    // Check location references (for agents/forces)
    if (attrs.location && typeof attrs.location === 'string') {
      if (!entityIds.has(attrs.location)) {
        result.warnings.push(`${id}: references unknown location '${attrs.location}'`);
      }
    }
  }

  // === LOCATION HIERARCHY ===

  const locationIds = new Set(locations.keys());

  for (const [id, location] of locations) {
    // Check parent reference
    const parentId = location.hierarchy?.parent?.location_id;
    if (parentId && !locationIds.has(parentId)) {
      result.errors.push(`${id}: parent '${parentId}' not found`);
      result.valid = false;
    }

    // Check children references
    const children = location.hierarchy?.children || [];
    for (const child of children) {
      if (child.location_id && !locationIds.has(child.location_id)) {
        result.warnings.push(`${id}: child '${child.location_id}' not found`);
      }
    }

    // Check entity_id reference
    if (location.entity_id && !entityIds.has(location.entity_id)) {
      result.warnings.push(`${id}: entity_id '${location.entity_id}' not found`);
    }
  }

  // === VICTORY CONDITIONS ===

  if (!config.victory_conditions) {
    result.warnings.push('No victory conditions defined');
  } else {
    const conditions = Object.entries(config.victory_conditions);
    if (conditions.length < 2) {
      result.warnings.push('Should have at least 2 victory conditions (one per major faction)');
    }

    // Check that victory conditions reference valid entities
    for (const [condId, cond] of conditions) {
      if (cond.condition) {
        // Extract entity references from condition string
        const entityRefs = cond.condition.match(/[a-z_]+\.[a-z_]+/g) || [];
        for (const ref of entityRefs) {
          // Only check if it looks like an entity ID (not an attribute like .influence)
          if (!ref.includes('.') || ref.split('.').length === 2) {
            const [type] = ref.split('.');
            if (['polity', 'region', 'force', 'agent', 'presence', 'locale', 'holding'].includes(type)) {
              if (!entityIds.has(ref)) {
                result.warnings.push(`Victory condition '${condId}' references unknown entity '${ref}'`);
              }
            }
          }
        }
      }
    }
  }

  // === SCENARIO.JSON ENTITIES LIST ===

  if (config.entities) {
    // Check that listed entities exist
    const allListed = [
      ...(config.entities.polities || []),
      ...(config.entities.regions || []),
      ...(config.entities.forces || []),
      ...(config.entities.agents || []),
      ...(config.entities.locales || []),
    ];

    for (const entityId of allListed) {
      if (!entityIds.has(entityId)) {
        result.warnings.push(`scenario.json lists '${entityId}' but entity file not found`);
      }
    }
  }

  // === RULES FILES ===

  const rulesDir = join(scenarioDir, 'rules');
  if (existsSync(rulesDir)) {
    const ruleFiles = readdirSync(rulesDir).filter(f => f.endsWith('.json'));
    result.info.push(`Rules files: ${ruleFiles.length}`);
  }

  return result;
}

function main() {
  const options = parseArgs();

  if (options.list) {
    listScenarios();
    return;
  }

  if (!options.scenario) {
    console.log('Usage: npx tsx validate.ts --scenario <id>');
    console.log('');
    console.log('Options:');
    console.log('  --scenario <id>  Scenario to validate');
    console.log('  --verbose        Show detailed output');
    console.log('  --list           List all scenarios');
    console.log('');
    console.log('Example:');
    console.log('  npx tsx validate.ts --scenario vega_conflict --verbose');
    process.exit(1);
  }

  const result = validateScenario(options.scenario, options.verbose || false);

  console.log('');
  console.log(`Validating scenario: ${options.scenario}`);
  console.log('='.repeat(50));

  // Show info
  if (options.verbose) {
    console.log('\nInfo:');
    for (const info of result.info) {
      console.log(`  ${info}`);
    }
  }

  // Show warnings
  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warning of result.warnings) {
      console.log(formatWarning(warning));
    }
  }

  // Show errors
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    for (const error of result.errors) {
      console.log(formatError(error));
    }
  }

  // Summary
  console.log('');
  if (result.valid) {
    console.log(formatSuccess('Scenario is valid and ready for simulation'));
  } else {
    console.log(formatError(`Scenario has ${result.errors.length} error(s) that must be fixed`));
  }

  if (result.warnings.length > 0) {
    console.log(formatWarning(`${result.warnings.length} warning(s) - scenario may work but could have issues`));
  }

  console.log('');
  process.exit(result.valid ? 0 : 1);
}

main();
