#!/usr/bin/env npx tsx

/**
 * Apply chronicle event effects to world state
 *
 * Usage:
 *   npx tsx apply.ts evt_10492              # Apply specific event
 *   npx tsx apply.ts --pending              # Apply all pending events
 *   npx tsx apply.ts evt_10492 --dry-run    # Show what would change
 *   npx tsx apply.ts --list-handlers        # List available handlers
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { type ChronicleEvent, type Entity } from '../../shared/types.js';
import {
  getChronicleFile,
  getEntitiesDir,
  getStateFile,
  readJson,
  writeJson,
  formatSuccess,
  formatError,
  formatWarning,
} from '../../shared/utils.js';
import { handlers, getHandler, listHandlers, type WorldAccessor, type EffectResult } from './handlers.js';

interface ApplyOptions {
  eventId?: string;
  pending?: boolean;
  dryRun?: boolean;
  listHandlersFlag?: boolean;
}

function parseArgs(): ApplyOptions {
  const args = process.argv.slice(2);
  const options: ApplyOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--pending':
        options.pending = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--list-handlers':
        options.listHandlersFlag = true;
        break;
      default:
        if (arg.startsWith('evt_')) {
          options.eventId = arg;
        }
    }
  }

  return options;
}

function loadEvent(eventId: string): ChronicleEvent | null {
  const chronicleFile = getChronicleFile();

  if (!existsSync(chronicleFile)) {
    return null;
  }

  const content = readFileSync(chronicleFile, 'utf-8');
  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line) as ChronicleEvent;
      if (event.id === eventId) {
        return event;
      }
    } catch {
      // Skip invalid lines
    }
  }

  return null;
}

function loadAllEvents(): ChronicleEvent[] {
  const chronicleFile = getChronicleFile();
  const events: ChronicleEvent[] = [];

  if (!existsSync(chronicleFile)) {
    return events;
  }

  const content = readFileSync(chronicleFile, 'utf-8');
  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line) as ChronicleEvent);
    } catch {
      // Skip invalid lines
    }
  }

  return events;
}

function createWorldAccessor(dryRun: boolean): WorldAccessor & { getModifications(): Map<string, Entity> } {
  const entitiesDir = getEntitiesDir();
  const modifications = new Map<string, Entity>();

  return {
    getEntity(id: string): Entity | null {
      // Check modifications first
      if (modifications.has(id)) {
        return modifications.get(id)!;
      }

      const filePath = join(entitiesDir, `${id}.json`);
      if (!existsSync(filePath)) {
        return null;
      }

      try {
        return readJson<Entity>(filePath);
      } catch {
        return null;
      }
    },

    saveEntity(entity: Entity): void {
      modifications.set(entity.id, entity);

      if (!dryRun) {
        const filePath = join(entitiesDir, `${entity.id}.json`);
        writeJson(filePath, entity);
      }
    },

    entityExists(id: string): boolean {
      if (modifications.has(id)) return true;
      const filePath = join(entitiesDir, `${id}.json`);
      return existsSync(filePath);
    },

    getModifications() {
      return modifications;
    },
  };
}

function applyEvent(event: ChronicleEvent, world: WorldAccessor, dryRun: boolean): EffectResult {
  const handler = getHandler(event.type);

  if (!handler) {
    return {
      modified: [],
      created: [],
      errors: [`No handler for event type: ${event.type}`],
    };
  }

  return handler(event, world);
}

async function main() {
  const options = parseArgs();

  if (options.listHandlersFlag) {
    console.log('Available effect handlers:\n');
    for (const handlerName of listHandlers()) {
      console.log(`  ${handlerName}`);
    }
    return;
  }

  if (!options.eventId && !options.pending) {
    console.log('Usage: npx tsx apply.ts <event_id> [--dry-run]');
    console.log('       npx tsx apply.ts --pending [--dry-run]');
    console.log('       npx tsx apply.ts --list-handlers');
    process.exit(1);
  }

  const entitiesDir = getEntitiesDir();
  if (!existsSync(entitiesDir)) {
    console.error(formatError('World not initialized. Run init first.'));
    process.exit(1);
  }

  const world = createWorldAccessor(options.dryRun || false);
  let totalModified = 0;
  let totalErrors = 0;

  if (options.eventId) {
    const event = loadEvent(options.eventId);
    if (!event) {
      console.error(formatError(`Event not found: ${options.eventId}`));
      process.exit(1);
    }

    const result = applyEvent(event, world, options.dryRun || false);

    if (options.dryRun) {
      console.log(`Dry run for ${event.id} (${event.type}):\n`);

      if (result.modified.length === 0 && result.errors.length === 0) {
        console.log('  No changes would be made.');
      }

      for (const id of result.modified) {
        const entity = world.getEntity(id);
        console.log(`  Would modify: ${id}`);
        if (entity) {
          console.log(`    ${JSON.stringify(entity.attrs, null, 2).split('\n').join('\n    ')}`);
        }
      }

      for (const error of result.errors) {
        console.log(formatWarning(`  ${error}`));
      }
    } else {
      if (result.modified.length > 0) {
        console.log(formatSuccess(`Applied ${event.id} (${event.type})`));
        for (const id of result.modified) {
          console.log(`  Modified: ${id}`);
        }
      }

      for (const error of result.errors) {
        console.log(formatWarning(`  ${error}`));
      }
    }

    totalModified = result.modified.length;
    totalErrors = result.errors.length;

  } else if (options.pending) {
    const events = loadAllEvents();
    console.log(`Processing ${events.length} events...\n`);

    for (const event of events) {
      const result = applyEvent(event, world, options.dryRun || false);

      if (result.modified.length > 0 || result.errors.length > 0) {
        const prefix = options.dryRun ? '[dry-run] ' : '';
        console.log(`${prefix}${event.id} (${event.type}):`);

        for (const id of result.modified) {
          console.log(`  ${options.dryRun ? 'Would modify' : 'Modified'}: ${id}`);
        }

        for (const error of result.errors) {
          console.log(formatWarning(`  ${error}`));
        }

        totalModified += result.modified.length;
        totalErrors += result.errors.length;
      }
    }
  }

  console.log('');
  const action = options.dryRun ? 'would modify' : 'modified';
  console.log(`Summary: ${totalModified} entities ${action}, ${totalErrors} errors`);
}

main().catch((err) => {
  console.error(formatError(err.message));
  process.exit(1);
});
