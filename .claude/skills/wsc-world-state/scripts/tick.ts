#!/usr/bin/env npx tsx

/**
 * Advance world tick
 *
 * Usage:
 *   npx tsx tick.ts                  # Advance by 1
 *   npx tsx tick.ts --count 5        # Advance by 5
 *   npx tsx tick.ts --to 1050        # Advance to specific tick
 */

import { existsSync } from 'fs';
import { type WorldState } from '../../shared/types.js';
import {
  getStateFile,
  readJson,
  writeJson,
  formatSuccess,
  formatError,
  formatWarning,
} from '../../shared/utils.js';

interface TickOptions {
  count?: number;
  to?: number;
}

function parseArgs(): TickOptions {
  const args = process.argv.slice(2);
  const options: TickOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--count':
        if (next) { options.count = parseInt(next, 10); i++; }
        break;
      case '--to':
        if (next) { options.to = parseInt(next, 10); i++; }
        break;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  const stateFile = getStateFile();

  if (!existsSync(stateFile)) {
    console.error(formatError('World not initialized.'));
    console.log('Run: npx tsx .claude/skills/wsc-world-state/scripts/init.ts');
    process.exit(1);
  }

  const state = readJson<WorldState>(stateFile);
  const previousTick = state.tick;

  if (options.to !== undefined) {
    if (options.to <= state.tick) {
      console.error(formatError(`Cannot go backwards. Current tick: ${state.tick}`));
      process.exit(1);
    }
    state.tick = options.to;
  } else {
    const count = options.count ?? 1;
    if (count < 1) {
      console.error(formatError('Count must be positive'));
      process.exit(1);
    }
    state.tick += count;
  }

  state.updated_at = new Date().toISOString();
  writeJson(stateFile, state);

  const delta = state.tick - previousTick;
  console.log(formatSuccess(`Advanced ${delta} tick(s): ${previousTick} → ${state.tick}`));
}

main().catch((err) => {
  console.error(formatError(err.message));
  process.exit(1);
});
