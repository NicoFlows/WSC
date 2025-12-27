#!/usr/bin/env npx tsx

/**
 * Initialize WSC world state
 *
 * Usage:
 *   npx tsx init.ts                              # Init from default scenario (vega_conflict)
 *   npx tsx init.ts --scenario shattered_realms  # Init from specific scenario
 *   npx tsx init.ts --empty                      # Init empty world
 *   npx tsx init.ts --name "My World"            # Set world name
 *   npx tsx init.ts --genre fantasy              # Set genre
 *   npx tsx init.ts --force                      # Overwrite existing
 *   npx tsx init.ts --reset                      # Reset to initial state
 *   npx tsx init.ts --list                       # List available scenarios
 */

import { existsSync, readdirSync, copyFileSync, rmSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { type WorldState } from '../../shared/types.js';
import {
  getWorldDir,
  getEntitiesDir,
  getExamplesDir,
  getScenariosDir,
  getScenarioDir,
  getChronicleFile,
  getStateFile,
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
  force?: boolean;
  reset?: boolean;
  name?: string;
  genre?: string;
  startTick?: number;
  scenario?: string;
  list?: boolean;
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
      case '--force':
        options.force = true;
        break;
      case '--reset':
        options.reset = true;
        break;
      case '--list':
        options.list = true;
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
    const activeMarker = registry.active === id ? ' [active]' : '';
    console.log(`\n  ${id}${activeMarker}`);
    console.log(`    Name: ${scenario.name}`);
    console.log(`    Genre: ${scenario.genre}`);
    console.log(`    Top agent: ${scenario.top_level_agent}`);
    console.log(`    Available: ${scenario.available_agents.join(', ')}`);
  }
  console.log('');
}

function copyScenarioEntities(scenarioId: string): number {
  const scenarioDir = getScenarioDir(scenarioId);
  const sourceDir = join(scenarioDir, 'entities');
  const targetDir = getEntitiesDir();

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

function copyScenarioEvents(scenarioId: string): number {
  const scenarioDir = getScenarioDir(scenarioId);
  const eventsDir = join(scenarioDir, 'events');
  const chronicleFile = getChronicleFile();

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

// Fallback: copy from old examples directory
function copyExampleEntities(): number {
  const sourceDir = join(getExamplesDir(), 'entities');
  const targetDir = getEntitiesDir();

  if (!existsSync(sourceDir)) {
    console.log(formatWarning('No example entities found'));
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

function createInitialState(options: InitOptions, scenarioConfig?: ScenarioConfig): WorldState {
  const name = options.name || scenarioConfig?.name || 'WSC World';
  const genre = options.genre || scenarioConfig?.genre || 'sci-fi';
  const tick = options.startTick ?? scenarioConfig?.starting_tick ?? 1000;

  return {
    tick,
    last_event_id: 10000,
    active_scenario: options.scenario,
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

function updateScenarioRegistry(scenarioId: string): void {
  const registryPath = join(getScenariosDir(), 'scenarios.json');
  if (!existsSync(registryPath)) {
    return;
  }

  const registry = readJson<ScenarioRegistry>(registryPath);
  registry.active = scenarioId;
  writeJson(registryPath, registry);
}

async function main() {
  const options = parseArgs();

  // Handle --list
  if (options.list) {
    listScenarios();
    return;
  }

  const worldDir = getWorldDir();
  const stateFile = getStateFile();

  // Check if world already exists
  if (existsSync(stateFile) && !options.force && !options.reset) {
    console.error(formatError('World already exists. Use --force to overwrite or --reset to reset.'));
    process.exit(1);
  }

  // Clear existing world if force/reset
  if ((options.force || options.reset) && existsSync(worldDir)) {
    console.log('Clearing existing world...');
    rmSync(worldDir, { recursive: true, force: true });
  }

  // Create world directory structure
  ensureDir(worldDir);
  ensureDir(getEntitiesDir());

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
      console.log(formatWarning(`Scenario ${scenarioId} not found, falling back to examples`));
      scenarioId = undefined;
    }
  }

  // Copy entities
  let entityCount = 0;
  let eventCount = 0;

  if (!options.empty) {
    if (scenarioId) {
      entityCount = copyScenarioEntities(scenarioId);
      console.log(formatSuccess(`Copied ${entityCount} entities from scenario ${scenarioId}`));

      eventCount = copyScenarioEvents(scenarioId);
      if (eventCount > 0) {
        console.log(formatSuccess(`Copied ${eventCount} events from scenario ${scenarioId}`));
      }

      // Update registry active scenario
      updateScenarioRegistry(scenarioId);
    } else {
      entityCount = copyExampleEntities();
      console.log(formatSuccess(`Copied ${entityCount} entities from examples`));
    }
  }

  // Create state file
  const state = createInitialState(options, scenarioConfig);
  writeJson(stateFile, state);
  console.log(formatSuccess('Created state.json'));

  // Create empty chronicle if not created by events
  const chronicleFile = getChronicleFile();
  if (!existsSync(chronicleFile)) {
    writeFileSync(chronicleFile, '', 'utf-8');
    console.log(formatSuccess('Created chronicle.ndjson'));
  }

  console.log('');
  console.log('World initialized:');
  console.log(`  Name: ${state.settings?.name}`);
  console.log(`  Genre: ${state.settings?.genre}`);
  console.log(`  Scenario: ${scenarioId || 'none'}`);
  console.log(`  Starting tick: ${state.tick}`);
  console.log(`  Entities: ${entityCount}`);
  console.log(`  Events: ${eventCount}`);
  console.log(`  Location: ${worldDir}`);
}

main().catch((err) => {
  console.error(formatError(err.message));
  process.exit(1);
});
