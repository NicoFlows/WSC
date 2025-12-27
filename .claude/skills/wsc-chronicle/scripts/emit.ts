#!/usr/bin/env npx tsx

/**
 * Emit a new chronicle event
 *
 * Usage:
 *   npx tsx emit.ts --type battle.resolved --where region.vega --who force.a,force.b \
 *     --data '{"outcome": "victory"}' --importance 0.8 --summary "Description..."
 *
 *   npx tsx emit.ts --type agent.killed --where locale.port --who agent.target \
 *     --causes evt_10001 --importance 0.9
 */

import { existsSync } from 'fs';
import {
  ChronicleEventSchema,
  WorldStateSchema,
  type ChronicleEvent,
} from '../../shared/types.js';
import {
  getChronicleFile,
  getStateFile,
  readJson,
  writeJson,
  appendNdjson,
  formatSuccess,
  formatError,
} from '../../shared/utils.js';

interface EmitOptions {
  type?: string;
  where?: string;
  who?: string[];
  data?: Record<string, unknown>;
  causes?: string[];
  source?: string;
  importance?: number;
  confidence?: number;
  summary?: string;
  dryRun?: boolean;
}

function parseArgs(): EmitOptions {
  const args = process.argv.slice(2);
  const options: EmitOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--type':
        if (next) {
          options.type = next;
          i++;
        }
        break;
      case '--where':
        if (next) {
          options.where = next;
          i++;
        }
        break;
      case '--who':
        if (next) {
          options.who = next.split(',').map((s) => s.trim());
          i++;
        }
        break;
      case '--data':
        if (next) {
          try {
            options.data = JSON.parse(next);
          } catch {
            console.error(formatError('Invalid JSON in --data'));
            process.exit(1);
          }
          i++;
        }
        break;
      case '--causes':
        if (next) {
          options.causes = next.split(',').map((s) => s.trim());
          i++;
        }
        break;
      case '--source':
        if (next) {
          options.source = next;
          i++;
        }
        break;
      case '--importance':
        if (next) {
          options.importance = parseFloat(next);
          i++;
        }
        break;
      case '--confidence':
        if (next) {
          options.confidence = parseFloat(next);
          i++;
        }
        break;
      case '--summary':
        if (next) {
          options.summary = next;
          i++;
        }
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
    }
  }

  return options;
}

function getNextEventId(): { id: string; num: number } {
  const stateFile = getStateFile();
  let lastEventNum = 10000;

  if (existsSync(stateFile)) {
    try {
      const state = readJson<{ last_event_id?: number }>(stateFile);
      lastEventNum = state.last_event_id || 10000;
    } catch {
      // Use default
    }
  }

  const nextNum = lastEventNum + 1;
  return { id: `evt_${nextNum}`, num: nextNum };
}

function getCurrentTick(): number {
  const stateFile = getStateFile();
  if (existsSync(stateFile)) {
    try {
      const state = readJson<{ tick?: number }>(stateFile);
      return state.tick || 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

function updateStateEventId(eventNum: number): void {
  const stateFile = getStateFile();
  let state: Record<string, unknown> = {};

  if (existsSync(stateFile)) {
    try {
      state = readJson<Record<string, unknown>>(stateFile);
    } catch {
      // Start fresh
    }
  }

  state.last_event_id = eventNum;
  state.updated_at = new Date().toISOString();
  writeJson(stateFile, state);
}

async function main() {
  const options = parseArgs();

  // Validate required fields
  if (!options.type) {
    console.error(formatError('--type is required'));
    console.log('');
    console.log('Usage: npx tsx emit.ts --type <event.type> --where <location> --who <entity1,entity2>');
    console.log('');
    console.log('Required:');
    console.log('  --type       Event type (e.g., battle.resolved, agent.killed)');
    console.log('  --where      Location entity ID');
    console.log('  --who        Comma-separated participant entity IDs');
    console.log('');
    console.log('Optional:');
    console.log('  --data       JSON object with event-specific data');
    console.log('  --causes     Comma-separated cause event IDs');
    console.log('  --source     Source lens (e.g., lens.galactic)');
    console.log('  --importance Importance score 0-1 (default: 0.5)');
    console.log('  --confidence Confidence score 0-1 (default: 1.0)');
    console.log('  --summary    Narrative summary text');
    console.log('  --dry-run    Show event without emitting');
    process.exit(1);
  }

  if (!options.where) {
    console.error(formatError('--where is required'));
    process.exit(1);
  }

  if (!options.who || options.who.length === 0) {
    console.error(formatError('--who is required (at least one participant)'));
    process.exit(1);
  }

  const { id, num } = getNextEventId();
  const tick = getCurrentTick();

  const event: ChronicleEvent = {
    id,
    t_world: tick,
    type: options.type,
    where: options.where,
    who: options.who,
    data: options.data || {},
    causes: options.causes,
    source: options.source || 'lens.manual',
    confidence: options.confidence ?? 1.0,
    importance: options.importance ?? 0.5,
    narrative_summary: options.summary,
  };

  // Validate against schema
  const result = ChronicleEventSchema.safeParse(event);
  if (!result.success) {
    console.error(formatError('Event validation failed:'));
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  if (options.dryRun) {
    console.log('Event (dry run):');
    console.log(JSON.stringify(event, null, 2));
    return;
  }

  // Emit event
  const chronicleFile = getChronicleFile();
  appendNdjson(chronicleFile, event);
  updateStateEventId(num);

  console.log(formatSuccess(`Emitted ${event.id}`));
  console.log(`  Type: ${event.type}`);
  console.log(`  Where: ${event.where}`);
  console.log(`  Who: ${event.who.join(', ')}`);
  console.log(`  Importance: ${event.importance}`);
  if (event.narrative_summary) {
    console.log(`  Summary: ${event.narrative_summary}`);
  }
}

main().catch((err) => {
  console.error(formatError(err.message));
  process.exit(1);
});
