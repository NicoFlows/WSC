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
 *
 * Hierarchical time filters:
 *   npx tsx query.ts --scale galactic           # Only top-level events
 *   npx tsx query.ts --scale scene              # Only scene-level events
 *   npx tsx query.ts --parent evt_10500         # Events drilled down from specific event
 *   npx tsx query.ts --depth 0                  # Only top-level events (depth 0)
 *   npx tsx query.ts --depth 1                  # Only first-level drill-downs
 *   npx tsx query.ts --tree evt_10500           # Show event and all descendants
 *
 * Output formats:
 *   npx tsx query.ts --verbose                  # Full details for each event
 *   npx tsx query.ts -v                         # Short form
 *   npx tsx query.ts --id evt_10492             # Show single event in full detail
 *   npx tsx query.ts --json                     # Raw JSON output
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { SimulationScales, type ChronicleEvent, type SimulationScale } from '../../shared/types.js';
import {
  getChronicleFile,
  getExamplesDir,
  formatTable,
  formatError,
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
  // Hierarchical time filters
  scale?: SimulationScale;
  parent?: string;
  depth?: number;
  tree?: string;  // Show event and all descendants
  // Output format
  verbose?: boolean;  // Show full details
  id?: string;        // Show single event by ID
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
      // Hierarchical time filters
      case '--scale':
        if (next) {
          if (SimulationScales.includes(next as SimulationScale)) {
            options.scale = next as SimulationScale;
          } else {
            console.error(formatError(`Invalid scale '${next}'. Valid: ${SimulationScales.join(', ')}`));
            process.exit(1);
          }
          i++;
        }
        break;
      case '--parent':
        if (next) { options.parent = next; i++; }
        break;
      case '--depth':
        if (next) { options.depth = parseInt(next, 10); i++; }
        break;
      case '--tree':
        if (next) { options.tree = next; i++; }
        break;
      // Output format
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--id':
        if (next) { options.id = next; i++; }
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

  // Scale filter
  if (options.scale && event.t_scale !== options.scale) {
    return false;
  }

  // Parent filter (events drilled down from a specific event)
  if (options.parent && event.t_parent !== options.parent) {
    return false;
  }

  // Depth filter
  if (options.depth !== undefined) {
    const eventDepth = event.t_depth ?? 0;
    if (eventDepth !== options.depth) {
      return false;
    }
  }

  return true;
}

/**
 * Get all descendants of an event (for --tree option)
 * Recursively finds events where t_parent links back to the root
 */
function getEventTree(rootId: string, allEvents: ChronicleEvent[]): ChronicleEvent[] {
  const result: ChronicleEvent[] = [];
  const visited = new Set<string>();

  function collectDescendants(parentId: string) {
    for (const event of allEvents) {
      if (event.t_parent === parentId && !visited.has(event.id)) {
        visited.add(event.id);
        result.push(event);
        collectDescendants(event.id);
      }
    }
  }

  // Include the root event itself
  const rootEvent = allEvents.find(e => e.id === rootId);
  if (rootEvent) {
    result.push(rootEvent);
    visited.add(rootId);
  }

  collectDescendants(rootId);
  return result;
}

function formatEventRow(event: ChronicleEvent): string[] {
  const importance = event.importance !== undefined
    ? event.importance.toFixed(2)
    : '?';

  const summary = event.narrative_summary
    ? event.narrative_summary.slice(0, 35) + (event.narrative_summary.length > 35 ? '...' : '')
    : event.type;

  // Format time with scale info
  let timeStr = `t=${event.t_world}`;
  if (event.t_scale) {
    const scaleAbbrev = event.t_scale.slice(0, 3);  // gal, con, cit, sce, act
    timeStr = `${timeStr}@${scaleAbbrev}`;
    if (event.t_local !== undefined) {
      timeStr = `${timeStr}:${event.t_local}`;
    }
  }

  // Show depth with indentation indicator
  const depthPrefix = event.t_depth ? '  '.repeat(event.t_depth) + '└─' : '';

  return [
    depthPrefix + event.id,
    timeStr,
    event.type,
    importance,
    summary,
  ];
}

/**
 * Format a single event with full details (verbose mode)
 */
function formatEventVerbose(event: ChronicleEvent): string {
  const lines: string[] = [];
  const divider = '─'.repeat(70);

  lines.push(divider);
  lines.push(`  ${event.id}  │  ${event.type}`);
  lines.push(divider);

  // Time information
  lines.push('');
  lines.push('  TIME');
  lines.push(`    t_world: ${event.t_world}`);
  if (event.t_scale) lines.push(`    t_scale: ${event.t_scale}`);
  if (event.t_local !== undefined) lines.push(`    t_local: ${event.t_local}`);
  if (event.t_parent) lines.push(`    t_parent: ${event.t_parent}`);
  if (event.t_depth !== undefined) lines.push(`    t_depth: ${event.t_depth}`);
  if (event.t_stream) lines.push(`    t_stream: ${event.t_stream}`);

  // Location and participants
  lines.push('');
  lines.push('  CONTEXT');
  lines.push(`    Where: ${event.where}`);
  lines.push(`    Who: ${event.who.join(', ')}`);

  // Causality
  if (event.causes && event.causes.length > 0) {
    lines.push(`    Causes: ${event.causes.join(', ')}`);
  }

  // Metadata
  lines.push('');
  lines.push('  METADATA');
  if (event.importance !== undefined) lines.push(`    Importance: ${event.importance.toFixed(2)}`);
  if (event.confidence !== undefined) lines.push(`    Confidence: ${event.confidence.toFixed(2)}`);
  if (event.source) lines.push(`    Source: ${event.source}`);

  // Narrative summary
  if (event.narrative_summary) {
    lines.push('');
    lines.push('  NARRATIVE');
    // Word wrap the summary
    const words = event.narrative_summary.split(' ');
    let currentLine = '    ';
    for (const word of words) {
      if (currentLine.length + word.length > 72) {
        lines.push(currentLine);
        currentLine = '    ' + word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }
    if (currentLine.trim()) lines.push(currentLine);
  }

  // Data payload
  if (event.data && Object.keys(event.data).length > 0) {
    lines.push('');
    lines.push('  DATA');
    const dataStr = JSON.stringify(event.data, null, 2);
    for (const line of dataStr.split('\n')) {
      lines.push('    ' + line);
    }
  }

  lines.push('');
  return lines.join('\n');
}

async function main() {
  const options = parseArgs();

  const allEvents = loadEvents(options);

  if (allEvents.length === 0) {
    console.log('No events found. Chronicle may be empty.');
    console.log('Use --examples to view example events.');
    return;
  }

  // Handle --id: find and display single event
  if (options.id) {
    const event = allEvents.find(e => e.id === options.id);
    if (!event) {
      console.log(`Event '${options.id}' not found.`);
      return;
    }
    if (options.json) {
      console.log(JSON.stringify(event, null, 2));
    } else {
      console.log(formatEventVerbose(event));
    }
    return;
  }

  // Default to showing last 10 events if no filters
  if (!options.type && !options.where && !options.who &&
      options.minImportance === undefined && options.after === undefined &&
      !options.causesOf && !options.causedBy &&
      !options.scale && !options.parent && options.depth === undefined && !options.tree) {
    options.last = options.last || 10;
  }

  let results: ChronicleEvent[];

  // Handle --tree specially: get event and all descendants
  if (options.tree) {
    results = getEventTree(options.tree, allEvents);
    if (results.length === 0) {
      console.log(`Event '${options.tree}' not found.`);
      return;
    }
    // Sort tree by depth then by t_local (to show hierarchy)
    results.sort((a, b) => {
      const depthA = a.t_depth ?? 0;
      const depthB = b.t_depth ?? 0;
      if (depthA !== depthB) return depthA - depthB;
      return (a.t_local ?? 0) - (b.t_local ?? 0);
    });
  } else {
    results = allEvents.filter(e => matchesQuery(e, options, allEvents));
    // Sort by world time descending
    results.sort((a, b) => b.t_world - a.t_world);
  }

  // Apply --last limit
  if (options.last && options.last > 0) {
    results = results.slice(0, options.last);
  }

  if (results.length === 0) {
    console.log('No events match the query.');
    return;
  }

  // Output format
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else if (options.verbose) {
    // Verbose: show full details for each event
    for (const event of results) {
      console.log(formatEventVerbose(event));
    }
    console.log(`${results.length} events found.`);
  } else {
    // Default: compact table
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
