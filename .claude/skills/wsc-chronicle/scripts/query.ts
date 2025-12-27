#!/usr/bin/env npx tsx

/**
 * Query chronicle events
 *
 * Usage:
 *   npx tsx query.ts --last 10
 *   npx tsx query.ts --type battle.resolved
 *   npx tsx query.ts --where region.vega
 *   npx tsx query.ts --who agent.captain_reva
 *   npx tsx query.ts --min-importance 0.7
 *   npx tsx query.ts --after 1040 --before 1050
 *   npx tsx query.ts --causes-of evt_10492
 *   npx tsx query.ts --caused-by evt_10311
 *   npx tsx query.ts --json
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { type ChronicleEvent } from '../../shared/types.js';
import {
  getChronicleFile,
  getExamplesDir,
  formatTable,
} from '../../shared/utils.js';

interface QueryOptions {
  last?: number;
  type?: string;
  where?: string;
  who?: string;
  minImportance?: number;
  maxImportance?: number;
  after?: number;
  before?: number;
  causesOf?: string;
  causedBy?: string;
  json?: boolean;
  examples?: boolean;
}

function parseArgs(): QueryOptions {
  const args = process.argv.slice(2);
  const options: QueryOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--last':
        options.last = next ? parseInt(next, 10) : 10;
        if (next && !isNaN(parseInt(next, 10))) i++;
        break;
      case '--type':
        if (next) { options.type = next; i++; }
        break;
      case '--where':
        if (next) { options.where = next; i++; }
        break;
      case '--who':
        if (next) { options.who = next; i++; }
        break;
      case '--min-importance':
        if (next) { options.minImportance = parseFloat(next); i++; }
        break;
      case '--max-importance':
        if (next) { options.maxImportance = parseFloat(next); i++; }
        break;
      case '--after':
        if (next) { options.after = parseFloat(next); i++; }
        break;
      case '--before':
        if (next) { options.before = parseFloat(next); i++; }
        break;
      case '--causes-of':
        if (next) { options.causesOf = next; i++; }
        break;
      case '--caused-by':
        if (next) { options.causedBy = next; i++; }
        break;
      case '--json':
        options.json = true;
        break;
      case '--examples':
        options.examples = true;
        break;
    }
  }

  return options;
}

function loadEvents(options: QueryOptions): ChronicleEvent[] {
  const events: ChronicleEvent[] = [];

  // Load from chronicle file
  const chronicleFile = getChronicleFile();
  if (!options.examples && existsSync(chronicleFile)) {
    const content = readFileSync(chronicleFile, 'utf-8');
    for (const line of content.split('\n')) {
      if (line.trim()) {
        try {
          events.push(JSON.parse(line) as ChronicleEvent);
        } catch {
          // Skip invalid lines
        }
      }
    }
  }

  // Load example events if requested or if no chronicle exists
  if (options.examples || events.length === 0) {
    const examplesDir = join(getExamplesDir(), 'events');
    if (existsSync(examplesDir)) {
      const files = readdirSync(examplesDir).filter((f: string) => f.endsWith('.json'));
      for (const file of files) {
        try {
          const content = readFileSync(join(examplesDir, file), 'utf-8');
          events.push(JSON.parse(content) as ChronicleEvent);
        } catch {
          // Skip invalid files
        }
      }
    }
  }

  return events;
}

function matchesQuery(event: ChronicleEvent, options: QueryOptions, allEvents: ChronicleEvent[]): boolean {
  // Type filter (supports wildcards like "battle.*")
  if (options.type) {
    if (options.type.endsWith('.*')) {
      const prefix = options.type.slice(0, -1);
      if (!event.type.startsWith(prefix)) return false;
    } else if (event.type !== options.type) {
      return false;
    }
  }

  // Location filter
  if (options.where && event.where !== options.where) {
    return false;
  }

  // Participant filter
  if (options.who && !event.who.includes(options.who)) {
    return false;
  }

  // Importance filters
  if (options.minImportance !== undefined && (event.importance ?? 0) < options.minImportance) {
    return false;
  }
  if (options.maxImportance !== undefined && (event.importance ?? 1) > options.maxImportance) {
    return false;
  }

  // Time filters
  if (options.after !== undefined && event.t_world < options.after) {
    return false;
  }
  if (options.before !== undefined && event.t_world > options.before) {
    return false;
  }

  // Causality: find events that caused the target
  if (options.causesOf) {
    const targetEvent = allEvents.find(e => e.id === options.causesOf);
    if (!targetEvent || !targetEvent.causes?.includes(event.id)) {
      return false;
    }
  }

  // Causality: find events caused by the target
  if (options.causedBy) {
    if (!event.causes?.includes(options.causedBy)) {
      return false;
    }
  }

  return true;
}

function formatEventRow(event: ChronicleEvent): string[] {
  const importance = event.importance !== undefined
    ? event.importance.toFixed(2)
    : '?';

  const summary = event.narrative_summary
    ? event.narrative_summary.slice(0, 40) + (event.narrative_summary.length > 40 ? '...' : '')
    : event.type;

  return [
    event.id,
    `t=${event.t_world}`,
    event.type,
    importance,
    summary,
  ];
}

async function main() {
  const options = parseArgs();

  // Default to showing last 10 events if no filters
  if (!options.type && !options.where && !options.who &&
      options.minImportance === undefined && options.after === undefined &&
      !options.causesOf && !options.causedBy) {
    options.last = options.last || 10;
  }

  const allEvents = loadEvents(options);

  if (allEvents.length === 0) {
    console.log('No events found. Chronicle may be empty.');
    console.log('Use --examples to view example events.');
    return;
  }

  let results = allEvents.filter(e => matchesQuery(e, options, allEvents));

  // Sort by world time descending
  results.sort((a, b) => b.t_world - a.t_world);

  // Apply --last limit
  if (options.last && options.last > 0) {
    results = results.slice(0, options.last);
  }

  if (results.length === 0) {
    console.log('No events match the query.');
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    const headers = ['ID', 'Time', 'Type', 'Imp', 'Summary'];
    const rows = results.map(formatEventRow);
    console.log(formatTable(headers, rows));
    console.log(`\n${results.length} events found.`);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
