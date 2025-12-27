#!/usr/bin/env npx tsx

/**
 * Show WSC world status
 *
 * Usage:
 *   npx tsx status.ts
 *   npx tsx status.ts --json
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { type WorldState, type ChronicleEvent, EntityTypes } from '../../shared/types.js';
import {
  getWorldDir,
  getEntitiesDir,
  getChronicleFile,
  getStateFile,
  readJson,
  formatTable,
  formatError,
  formatWarning,
} from '../../shared/utils.js';

interface StatusOptions {
  json?: boolean;
}

function parseArgs(): StatusOptions {
  const args = process.argv.slice(2);
  const options: StatusOptions = {};

  for (const arg of args) {
    if (arg === '--json') {
      options.json = true;
    }
  }

  return options;
}

function countEntitiesByType(): Record<string, number> {
  const counts: Record<string, number> = {};
  const entitiesDir = getEntitiesDir();

  if (!existsSync(entitiesDir)) {
    return counts;
  }

  const files = readdirSync(entitiesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const type = file.split('.')[0];
    counts[type] = (counts[type] || 0) + 1;
  }

  return counts;
}

function getRecentEvents(count: number): ChronicleEvent[] {
  const chronicleFile = getChronicleFile();
  const events: ChronicleEvent[] = [];

  if (!existsSync(chronicleFile)) {
    return events;
  }

  const content = readFileSync(chronicleFile, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  for (const line of lines.slice(-count)) {
    try {
      events.push(JSON.parse(line) as ChronicleEvent);
    } catch {
      // Skip invalid lines
    }
  }

  return events;
}

function getEventCount(): number {
  const chronicleFile = getChronicleFile();

  if (!existsSync(chronicleFile)) {
    return 0;
  }

  const content = readFileSync(chronicleFile, 'utf-8');
  return content.split('\n').filter(l => l.trim()).length;
}

async function main() {
  const options = parseArgs();
  const stateFile = getStateFile();

  if (!existsSync(stateFile)) {
    console.log(formatWarning('World not initialized.'));
    console.log('Run: npx tsx .claude/skills/wsc-world-state/scripts/init.ts');
    return;
  }

  const state = readJson<WorldState>(stateFile);
  const entityCounts = countEntitiesByType();
  const totalEntities = Object.values(entityCounts).reduce((a, b) => a + b, 0);
  const eventCount = getEventCount();
  const recentEvents = getRecentEvents(5);

  if (options.json) {
    console.log(JSON.stringify({
      state,
      entities: entityCounts,
      totalEntities,
      eventCount,
      recentEvents,
    }, null, 2));
    return;
  }

  console.log('=== WSC World Status ===\n');

  console.log('World:');
  console.log(`  Name: ${state.settings?.name || 'Unnamed'}`);
  console.log(`  Genre: ${state.settings?.genre || 'Unknown'}`);
  console.log(`  Scenario: ${state.active_scenario || 'none'}`);
  console.log(`  Current tick: ${state.tick}`);
  console.log(`  Created: ${state.created_at}`);
  console.log(`  Updated: ${state.updated_at}`);

  // Show active conflicts
  const conflicts = state.active_conflicts || [];
  if (conflicts.length > 0) {
    console.log(`\nActive Conflicts: ${conflicts.length}`);
    for (const c of conflicts) {
      console.log(`  - ${c.id}: ${c.parties.join(' vs ')} in ${c.location} (intensity: ${c.intensity})`);
    }
  }

  // Show drill-down opportunities
  const opportunities = state.drill_down_opportunities || [];
  if (opportunities.length > 0) {
    console.log(`\nDrill-Down Opportunities: ${opportunities.length}`);
    for (const o of opportunities) {
      const marker = o.importance > 0.7 ? '[!]' : '[ ]';
      console.log(`  ${marker} ${o.description} (${o.importance.toFixed(2)}) → ${o.suggested_agent}`);
    }
  }

  console.log('\nEntities:');
  if (totalEntities === 0) {
    console.log('  (none)');
  } else {
    const rows = Object.entries(entityCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => [type, String(count)]);
    console.log(formatTable(['Type', 'Count'], rows).split('\n').map(l => '  ' + l).join('\n'));
    console.log(`\n  Total: ${totalEntities}`);
  }

  console.log(`\nChronicle: ${eventCount} events`);

  if (recentEvents.length > 0) {
    console.log('\nRecent events:');
    for (const event of recentEvents) {
      const summary = event.narrative_summary
        ? event.narrative_summary.slice(0, 50) + (event.narrative_summary.length > 50 ? '...' : '')
        : event.type;
      console.log(`  ${event.id} (t=${event.t_world}): ${summary}`);
    }
  }
}

main().catch((err) => {
  console.error(formatError(err.message));
  process.exit(1);
});
