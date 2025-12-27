#!/usr/bin/env npx tsx

/**
 * Initialize WSC world instance
 *
 * Usage:
 *   npx tsx init.ts                              # Create new world from active scenario
 *   npx tsx init.ts --scenario shattered_realms  # Create new world from specific scenario
 *   npx tsx init.ts --name "My Campaign"         # Set world name
 *   npx tsx init.ts --id my_world                # Use specific world ID
 *   npx tsx init.ts --empty                      # Create empty world
 *   npx tsx init.ts --list                       # List available scenarios
 *   npx tsx init.ts --list-worlds                # List existing world instances
 *   npx tsx init.ts --switch <world_id>          # Switch to existing world
 *   npx tsx init.ts --delete <world_id>          # Delete a world instance
 */

import { existsSync, readdirSync, copyFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { type WorldState } from '../../shared/types.js';
import {
  getWorldDir,
  getWorldsDir,
  getWorldInstanceDir,
  getEntitiesDir,
  getLocationsDir,
  getScenariosDir,
  getScenarioDir,
  getChronicleFile,
  getStateFile,
  getWorldsRegistry,
  saveWorldsRegistry,
  generateWorldId,
  listWorlds,
  setActiveWorld,
  ensureDir,
  writeJson,
  readJson,
  formatSuccess,
  formatError,
  formatWarning,
} from '../../shared/utils.js';

interface ScenarioRegistry {
  active: string;
  scenarios: Record<string, {
    name: string;
    genre: string;
    path: string;
    top_level_agent: string;
    available_agents: string[];
  }>;
}

interface ScenarioConfig {
  name: string;
  genre: string;
  starting_tick?: number;
  description?: string;
}

interface InitOptions {
  empty?: boolean;
  name?: string;
  genre?: string;
  startTick?: number;
  scenario?: string;
  worldId?: string;
  list?: boolean;
  listWorlds?: boolean;
  switch?: string;
  delete?: string;
}

function parseArgs(): InitOptions {
  const args = process.argv.slice(2);
  const options: InitOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--empty':
        options.empty = true;
        break;
      case '--list':
        options.list = true;
        break;
      case '--list-worlds':
        options.listWorlds = true;
        break;
      case '--name':
        if (next) { options.name = next; i++; }
        break;
      case '--genre':
        if (next) { options.genre = next; i++; }
        break;
      case '--start-tick':
        if (next) { options.startTick = parseInt(next, 10); i++; }
        break;
      case '--scenario':
        if (next) { options.scenario = next; i++; }
        break;
      case '--id':
        if (next) { options.worldId = next; i++; }
        break;
      case '--switch':
        if (next) { options.switch = next; i++; }
        break;
      case '--delete':
        if (next) { options.delete = next; i++; }
        break;
    }
  }

  return options;
}

function getScenarioRegistry(): ScenarioRegistry | null {
  const registryPath = join(getScenariosDir(), 'scenarios.json');
  if (!existsSync(registryPath)) {
    return null;
  }
  return readJson<ScenarioRegistry>(registryPath);
}

function listScenarios(): void {
  const registry = getScenarioRegistry();

  if (!registry) {
    console.log(formatWarning('No scenarios.json found'));
    return;
  }

  console.log('\nAvailable Scenarios:');
  console.log('=' .repeat(50));

  for (const [id, scenario] of Object.entries(registry.scenarios)) {
    const activeMarker = registry.active === id ? ' [default]' : '';
    console.log(`\n  ${id}${activeMarker}`);
    console.log(`    Name: ${scenario.name}`);
    console.log(`    Genre: ${scenario.genre}`);
    console.log(`    Top agent: ${scenario.top_level_agent}`);
    console.log(`    Available: ${scenario.available_agents.join(', ')}`);
  }
  console.log('');
}

function listWorldInstances(): void {
  const worlds = listWorlds();

  if (worlds.length === 0) {
    console.log(formatWarning('No world instances found'));
    console.log('Use: npx tsx init.ts --scenario <name> to create one');
    return;
  }

  console.log('\nWorld Instances:');
  console.log('=' .repeat(60));

  for (const world of worlds) {
    const activeMarker = world.active ? ' [active]' : '';
    console.log(`\n  ${world.id}${activeMarker}`);
    console.log(`    Name: ${world.name}`);
    console.log(`    Scenario: ${world.scenario}`);
  }
  console.log('');
}

function switchWorld(worldId: string): void {
  try {
    setActiveWorld(worldId);
    console.log(formatSuccess(`Switched to world: ${worldId}`));

    // Show world status
    const stateFile = getStateFile(worldId);
    if (existsSync(stateFile)) {
      const state = readJson<WorldState>(stateFile);
      console.log(`  Tick: ${state.tick}`);
      console.log(`  Name: ${state.settings?.name}`);
      console.log(`  Scenario: ${state.active_scenario}`);
    }
  } catch (err) {
    console.error(formatError((err as Error).message));
    process.exit(1);
  }
}

function deleteWorld(worldId: string): void {
  const registry = getWorldsRegistry();

  if (!registry.worlds[worldId]) {
    console.error(formatError(`World '${worldId}' does not exist`));
    process.exit(1);
  }

  const worldDir = getWorldInstanceDir(worldId);
  if (existsSync(worldDir)) {
    rmSync(worldDir, { recursive: true, force: true });
  }

  delete registry.worlds[worldId];

  // If this was the active world, clear active
  if (registry.active_world === worldId) {
    registry.active_world = null;
  }

  saveWorldsRegistry(registry);
  console.log(formatSuccess(`Deleted world: ${worldId}`));
}

function copyScenarioEntities(scenarioId: string, worldId: string): number {
  const scenarioDir = getScenarioDir(scenarioId);
  const sourceDir = join(scenarioDir, 'entities');
  const targetDir = getEntitiesDir(worldId);

  if (!existsSync(sourceDir)) {
    console.log(formatWarning(`No entities found in scenario ${scenarioId}`));
    return 0;
  }

  ensureDir(targetDir);

  const files = readdirSync(sourceDir).filter(f => f.endsWith('.json'));
  let copied = 0;

  for (const file of files) {
    const source = join(sourceDir, file);
    const target = join(targetDir, file);
    copyFileSync(source, target);
    copied++;
  }

  return copied;
}

function copyScenarioLocations(scenarioId: string, worldId: string): number {
  const scenarioDir = getScenarioDir(scenarioId);
  const sourceDir = join(scenarioDir, 'locations');
  const targetDir = getLocationsDir(worldId);

  if (!existsSync(sourceDir)) {
    return 0;
  }

  ensureDir(targetDir);

  const files = readdirSync(sourceDir).filter(f => f.endsWith('.json'));
  let copied = 0;

  for (const file of files) {
    const source = join(sourceDir, file);
    const target = join(targetDir, file);
    copyFileSync(source, target);
    copied++;
  }

  return copied;
}

function copyScenarioEvents(scenarioId: string, worldId: string): number {
  const scenarioDir = getScenarioDir(scenarioId);
  const eventsDir = join(scenarioDir, 'events');
  const chronicleFile = getChronicleFile(worldId);

  if (!existsSync(eventsDir)) {
    return 0;
  }

  const files = readdirSync(eventsDir).filter(f => f.endsWith('.json'));
  let copied = 0;

  // Read and append events to chronicle
  for (const file of files) {
    const eventPath = join(eventsDir, file);
    const event = readJson<Record<string, unknown>>(eventPath);
    const line = JSON.stringify(event) + '\n';

    if (copied === 0) {
      writeFileSync(chronicleFile, line, 'utf-8');
    } else {
      const { appendFileSync } = require('fs');
      appendFileSync(chronicleFile, line, 'utf-8');
    }
    copied++;
  }

  return copied;
}

function createInitialState(
  options: InitOptions,
  scenarioId: string | undefined,
  scenarioConfig?: ScenarioConfig
): WorldState {
  const name = options.name || scenarioConfig?.name || 'WSC World';
  const genre = options.genre || scenarioConfig?.genre || 'sci-fi';
  const tick = options.startTick ?? scenarioConfig?.starting_tick ?? 1000;

  return {
    tick,
    last_event_id: 10000,
    active_scenario: scenarioId,
    drill_down_opportunities: [],
    active_conflicts: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    settings: {
      name,
      genre,
    },
  };
}

async function main() {
  const options = parseArgs();

  // Ensure worlds directory exists
  ensureDir(getWorldsDir());

  // Handle --list (scenarios)
  if (options.list) {
    listScenarios();
    return;
  }

  // Handle --list-worlds
  if (options.listWorlds) {
    listWorldInstances();
    return;
  }

  // Handle --switch
  if (options.switch) {
    switchWorld(options.switch);
    return;
  }

  // Handle --delete
  if (options.delete) {
    deleteWorld(options.delete);
    return;
  }

  // === Create new world instance ===

  // Determine scenario
  let scenarioId = options.scenario;
  let scenarioConfig: ScenarioConfig | undefined;

  if (!options.empty) {
    const registry = getScenarioRegistry();

    // Use specified scenario, or active from registry, or default to vega_conflict
    if (!scenarioId && registry) {
      scenarioId = registry.active || 'vega_conflict';
    } else if (!scenarioId) {
      scenarioId = 'vega_conflict';
    }

    // Check if scenario exists
    const scenarioDir = getScenarioDir(scenarioId);
    const scenarioConfigPath = join(scenarioDir, 'scenario.json');

    if (existsSync(scenarioConfigPath)) {
      scenarioConfig = readJson<ScenarioConfig>(scenarioConfigPath);
      console.log(formatSuccess(`Using scenario: ${scenarioId}`));
    } else {
      console.error(formatError(`Scenario '${scenarioId}' not found`));
      console.log('Use --list to see available scenarios');
      process.exit(1);
    }
  }

  // Generate or use provided world ID
  const worldId = options.worldId || (scenarioId ? generateWorldId(scenarioId) : generateWorldId('world'));
  const worldDir = getWorldInstanceDir(worldId);

  // Check if world already exists
  if (existsSync(worldDir)) {
    console.error(formatError(`World '${worldId}' already exists`));
    console.log('Use a different --id or omit to auto-generate');
    process.exit(1);
  }

  // Create world directory structure
  ensureDir(worldDir);
  ensureDir(getEntitiesDir(worldId));
  ensureDir(getLocationsDir(worldId));

  // Copy entities and locations
  let entityCount = 0;
  let locationCount = 0;
  let eventCount = 0;

  if (!options.empty && scenarioId) {
    entityCount = copyScenarioEntities(scenarioId, worldId);
    console.log(formatSuccess(`Copied ${entityCount} entities`));

    locationCount = copyScenarioLocations(scenarioId, worldId);
    if (locationCount > 0) {
      console.log(formatSuccess(`Copied ${locationCount} locations`));
    }

    eventCount = copyScenarioEvents(scenarioId, worldId);
    if (eventCount > 0) {
      console.log(formatSuccess(`Copied ${eventCount} events`));
    }
  }

  // Create state file
  const state = createInitialState(options, scenarioId, scenarioConfig);
  writeJson(getStateFile(worldId), state);
  console.log(formatSuccess('Created state.json'));

  // Create empty chronicle if not created by events
  const chronicleFile = getChronicleFile(worldId);
  if (!existsSync(chronicleFile)) {
    writeFileSync(chronicleFile, '', 'utf-8');
    console.log(formatSuccess('Created chronicle.ndjson'));
  }

  // Update worlds registry
  const registry = getWorldsRegistry();
  registry.worlds[worldId] = {
    scenario: scenarioId || 'empty',
    name: state.settings?.name || worldId,
    created_at: new Date().toISOString(),
    last_played: new Date().toISOString(),
  };
  registry.active_world = worldId;
  saveWorldsRegistry(registry);

  console.log('');
  console.log('World created:');
  console.log(`  ID: ${worldId}`);
  console.log(`  Name: ${state.settings?.name}`);
  console.log(`  Genre: ${state.settings?.genre}`);
  console.log(`  Scenario: ${scenarioId || 'none'}`);
  console.log(`  Starting tick: ${state.tick}`);
  console.log(`  Entities: ${entityCount}`);
  console.log(`  Locations: ${locationCount}`);
  console.log(`  Events: ${eventCount}`);
  console.log(`  Location: ${worldDir}`);
  console.log('');
  console.log(formatSuccess('World is now active'));
}

main().catch((err) => {
  console.error(formatError(err.message));
  process.exit(1);
});
