#!/usr/bin/env npx tsx

/**
 * Initialize WSC world state
 *
 * Usage:
 *   npx tsx init.ts                           # Init from examples
 *   npx tsx init.ts --empty                   # Init empty world
 *   npx tsx init.ts --name "My World"         # Set world name
 *   npx tsx init.ts --genre fantasy           # Set genre
 *   npx tsx init.ts --force                   # Overwrite existing
 *   npx tsx init.ts --reset                   # Reset to initial state
 */

import { existsSync, readdirSync, copyFileSync, rmSync } from 'fs';
import { join, basename } from 'path';
import { type WorldState } from '../../shared/types.js';
import {
  getWorldDir,
  getEntitiesDir,
  getExamplesDir,
  getChronicleFile,
  getStateFile,
  ensureDir,
  writeJson,
  formatSuccess,
  formatError,
  formatWarning,
} from '../../shared/utils.js';

interface InitOptions {
  empty?: boolean;
  force?: boolean;
  reset?: boolean;
  name?: string;
  genre?: string;
  startTick?: number;
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
      case '--name':
        if (next) { options.name = next; i++; }
        break;
      case '--genre':
        if (next) { options.genre = next; i++; }
        break;
      case '--start-tick':
        if (next) { options.startTick = parseInt(next, 10); i++; }
        break;
    }
  }

  return options;
}

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

function createInitialState(options: InitOptions): WorldState {
  return {
    tick: options.startTick ?? 1000,
    last_event_id: 10000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    settings: {
      name: options.name || 'WSC World',
      genre: options.genre || 'sci-fi',
    },
  };
}

async function main() {
  const options = parseArgs();
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

  // Copy entities unless --empty
  let entityCount = 0;
  if (!options.empty) {
    entityCount = copyExampleEntities();
    console.log(formatSuccess(`Copied ${entityCount} entities from examples`));
  }

  // Create state file
  const state = createInitialState(options);
  writeJson(stateFile, state);
  console.log(formatSuccess('Created state.json'));

  // Create empty chronicle
  const chronicleFile = getChronicleFile();
  if (!existsSync(chronicleFile)) {
    writeJson(chronicleFile, ''); // Creates empty file
    // Actually write empty file, not JSON
    const { writeFileSync } = await import('fs');
    writeFileSync(chronicleFile, '', 'utf-8');
    console.log(formatSuccess('Created chronicle.ndjson'));
  }

  console.log('');
  console.log('World initialized:');
  console.log(`  Name: ${state.settings?.name}`);
  console.log(`  Genre: ${state.settings?.genre}`);
  console.log(`  Starting tick: ${state.tick}`);
  console.log(`  Entities: ${entityCount}`);
  console.log(`  Location: ${worldDir}`);
}

main().catch((err) => {
  console.error(formatError(err.message));
  process.exit(1);
});
