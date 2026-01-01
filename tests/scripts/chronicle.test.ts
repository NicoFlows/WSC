#!/usr/bin/env npx tsx

/**
 * Chronicle Script Tests
 *
 * Tests for emit.ts and query.ts chronicle scripts.
 */

import { execSync, spawnSync } from 'child_process';
import { existsSync, readFileSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '../..');
const SCRIPTS_DIR = join(ROOT_DIR, '.claude/skills/wsc-chronicle/scripts');
const FIXTURES_DIR = join(__dirname, '../fixtures');

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertIncludes(output: string, substring: string, message: string) {
  assert(output.includes(substring), `${message} (expected to include "${substring}")`);
}

function runScript(script: string, args: string[] = []): { stdout: string; stderr: string; status: number } {
  const result = spawnSync('npx', ['tsx', join(SCRIPTS_DIR, script), ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
    timeout: 10000,
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status || 0,
  };
}

// ============================================================================
// QUERY TESTS
// ============================================================================

console.log('\n📋 Chronicle Query Tests\n');

// Test 1: Query with --examples flag loads example events
{
  const result = runScript('query.ts', ['--examples', '--last', '10']);
  assertIncludes(result.stdout, 'evt_', 'Query --examples returns event IDs');
  assertIncludes(result.stdout, 'events found', 'Query shows event count');
}

// Test 2: Query specific event by ID
{
  const result = runScript('query.ts', ['--examples', '--id', 'evt_10492']);
  assertIncludes(result.stdout, 'evt_10492', 'Query --id finds specific event');
  assertIncludes(result.stdout, 'battle.resolved', 'Event has correct type');
  assertIncludes(result.stdout, 'TIME', 'Verbose output shows TIME section');
  assertIncludes(result.stdout, 'CONTEXT', 'Verbose output shows CONTEXT section');
}

// Test 3: Query with --json flag
{
  const result = runScript('query.ts', ['--examples', '--id', 'evt_10492', '--json']);
  assert(result.stdout.includes('"id": "evt_10492"'), 'JSON output is valid');
  assert(result.stdout.includes('"type": "battle.resolved"'), 'JSON has type field');
}

// Test 4: Query by type filter
{
  const result = runScript('query.ts', ['--examples', '--type', 'battle.resolved']);
  assertIncludes(result.stdout, 'battle.resolved', 'Type filter works');
}

// Test 5: Query by scale filter
{
  const result = runScript('query.ts', ['--examples', '--scale', 'galactic']);
  assertIncludes(result.stdout, 'gal', 'Scale filter shows galactic events');
}

// Test 6: Query by scale filter - scene
{
  const result = runScript('query.ts', ['--examples', '--scale', 'scene']);
  assertIncludes(result.stdout, 'sce', 'Scale filter shows scene events');
}

// Test 7: Query with verbose flag
{
  const result = runScript('query.ts', ['--examples', '--verbose', '--last', '2']);
  assertIncludes(result.stdout, 'TIME', 'Verbose output has TIME section');
  assertIncludes(result.stdout, 'METADATA', 'Verbose output has METADATA section');
}

// Test 8: Query by who (participant)
{
  const result = runScript('query.ts', ['--examples', '--who', 'agent.captain_reva']);
  assertIncludes(result.stdout, 'evt_', 'Who filter returns events');
}

// Test 9: Query by where (location)
{
  const result = runScript('query.ts', ['--examples', '--where', 'region.vega']);
  assertIncludes(result.stdout, 'evt_', 'Where filter returns events');
}

// Test 10: Query by importance threshold
{
  const result = runScript('query.ts', ['--examples', '--min-importance', '0.8']);
  assertIncludes(result.stdout, 'evt_', 'Min-importance filter returns events');
}

// Test 11: Query invalid event ID
{
  const result = runScript('query.ts', ['--examples', '--id', 'evt_99999']);
  assertIncludes(result.stdout, 'not found', 'Invalid ID shows not found message');
}

// Test 12: Query invalid scale shows error
{
  const result = runScript('query.ts', ['--examples', '--scale', 'invalid_scale']);
  assert(result.status !== 0 || result.stderr.includes('Invalid scale'), 'Invalid scale is rejected');
}

// Test 13: Query tree (hierarchical)
{
  const result = runScript('query.ts', ['--examples', '--tree', 'evt_10492']);
  assertIncludes(result.stdout, 'evt_10492', 'Tree query includes root event');
}

// Test 14: Query depth filter
{
  const result = runScript('query.ts', ['--examples', '--depth', '0']);
  assertIncludes(result.stdout, 'evt_', 'Depth filter returns events');
}

// ============================================================================
// EMIT TESTS (dry-run only to avoid side effects)
// ============================================================================

console.log('\n📝 Chronicle Emit Tests\n');

// Test 15: Emit help shows usage
{
  const result = runScript('emit.ts', []);
  assertIncludes(result.stdout, '--type', 'Help shows --type option');
  assertIncludes(result.stdout, '--where', 'Help shows --where option');
  assertIncludes(result.stdout, '--who', 'Help shows --who option');
}

// Test 16: Emit dry-run creates valid event
{
  const result = runScript('emit.ts', [
    '--type', 'test.event',
    '--where', 'region.test',
    '--who', 'agent.test',
    '--dry-run',
  ]);
  assertIncludes(result.stdout, 'evt_', 'Dry-run shows event ID');
  assertIncludes(result.stdout, 'test.event', 'Dry-run shows event type');
}

// Test 17: Emit with scale option
{
  const result = runScript('emit.ts', [
    '--type', 'test.scaled',
    '--where', 'region.test',
    '--who', 'agent.test',
    '--scale', 'scene',
    '--dry-run',
  ]);
  // Dry-run outputs JSON, so check for the JSON format
  assertIncludes(result.stdout, '"t_scale": "scene"', 'Scale is set correctly');
}

// Test 18: Emit with parent and depth
{
  const result = runScript('emit.ts', [
    '--type', 'test.drilldown',
    '--where', 'locale.test',
    '--who', 'agent.test',
    '--scale', 'action',
    '--parent', 'evt_10000',
    '--depth', '2',
    '--dry-run',
  ]);
  // Dry-run outputs JSON format
  assertIncludes(result.stdout, '"t_parent": "evt_10000"', 'Parent is set correctly');
  assertIncludes(result.stdout, '"t_depth": 2', 'Depth is set correctly');
}

// Test 19: Emit with data payload
{
  const result = runScript('emit.ts', [
    '--type', 'test.data',
    '--where', 'region.test',
    '--who', 'agent.test',
    '--data', '{"outcome": "success", "value": 42}',
    '--dry-run',
  ]);
  assertIncludes(result.stdout, 'test.data', 'Event with data is created');
}

// Test 20: Emit with importance and summary
{
  const result = runScript('emit.ts', [
    '--type', 'test.important',
    '--where', 'region.test',
    '--who', 'agent.test',
    '--importance', '0.95',
    '--summary', 'This is a test summary',
    '--dry-run',
  ]);
  // Dry-run outputs JSON format
  assertIncludes(result.stdout, '"importance": 0.95', 'Importance is set');
  assertIncludes(result.stdout, 'This is a test summary', 'Summary is included');
}

// Test 21: Emit requires --type
{
  const result = runScript('emit.ts', [
    '--where', 'region.test',
    '--who', 'agent.test',
  ]);
  // Should show help (missing required arg)
  assertIncludes(result.stdout, '--type', 'Missing --type shows help');
}

// Test 22: Emit with invalid scale
{
  const result = runScript('emit.ts', [
    '--type', 'test.invalid',
    '--where', 'region.test',
    '--who', 'agent.test',
    '--scale', 'invalid',
    '--dry-run',
  ]);
  assert(result.status !== 0 || result.stderr.includes('Invalid scale'), 'Invalid scale is rejected');
}

// ============================================================================
// LOCATION EMBEDDING TESTS
// ============================================================================

console.log('\n📍 Location Embedding Tests\n');

// Test 23: Emit with known location embeds where_location by default
{
  const result = runScript('emit.ts', [
    '--type', 'test.location',
    '--where', 'region.vega',
    '--who', 'agent.test',
    '--dry-run',
  ]);
  assertIncludes(result.stdout, '"where_location"', 'Location embedding is included by default');
  assertIncludes(result.stdout, '"hierarchy"', 'Location includes hierarchy');
}

// Test 24: Location embedding includes system name for region
{
  const result = runScript('emit.ts', [
    '--type', 'test.location',
    '--where', 'region.vega',
    '--who', 'agent.test',
    '--dry-run',
  ]);
  assertIncludes(result.stdout, 'Vega System', 'Location includes system name');
}

// Test 25: Location embedding includes locale details
{
  const result = runScript('emit.ts', [
    '--type', 'test.location',
    '--where', 'locale.port_nexus',
    '--who', 'agent.test',
    '--dry-run',
  ]);
  assertIncludes(result.stdout, '"locale":', 'Locale field is present');
  assertIncludes(result.stdout, 'Port Nexus', 'Locale name is included');
}

// Test 26: Location embedding includes orbit_au when available
{
  const result = runScript('emit.ts', [
    '--type', 'test.location',
    '--where', 'locale.port_nexus',
    '--who', 'agent.test',
    '--dry-run',
  ]);
  assertIncludes(result.stdout, '"orbit_au"', 'Orbit AU is included when available');
}

// Test 27: --no-location flag skips embedding
{
  const result = runScript('emit.ts', [
    '--type', 'test.location',
    '--where', 'region.vega',
    '--who', 'agent.test',
    '--no-location',
    '--dry-run',
  ]);
  assert(!result.stdout.includes('"where_location"'), '--no-location skips embedding');
}

// Test 28: Unknown location still works (no embedding)
{
  const result = runScript('emit.ts', [
    '--type', 'test.location',
    '--where', 'region.unknown_region',
    '--who', 'agent.test',
    '--dry-run',
  ]);
  assert(result.status === 0, 'Unknown location does not cause error');
  assertIncludes(result.stdout, '"where": "region.unknown_region"', 'Event still has where field');
}

// Test 29: Location hierarchy is complete
{
  const result = runScript('emit.ts', [
    '--type', 'test.location',
    '--where', 'locale.port_nexus',
    '--who', 'agent.test',
    '--dry-run',
  ]);
  assertIncludes(result.stdout, 'location.galaxy.local_cluster', 'Hierarchy includes galaxy');
  assertIncludes(result.stdout, 'location.sector.coreward_reach', 'Hierarchy includes sector');
  assertIncludes(result.stdout, 'location.system.vega', 'Hierarchy includes system');
}

// Test 30: Help shows --no-location option
{
  const result = runScript('emit.ts', []);
  assertIncludes(result.stdout, '--no-location', 'Help shows --no-location option');
}

// Test 31: Location embedding includes coords when available
{
  const result = runScript('emit.ts', [
    '--type', 'test.location',
    '--where', 'region.vega',
    '--who', 'agent.test',
    '--dry-run',
  ]);
  assertIncludes(result.stdout, '"coords"', 'Coordinates are included when available');
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '═'.repeat(50));
console.log(`Chronicle Tests: ${testsPassed} passed, ${testsFailed} failed`);
console.log('═'.repeat(50) + '\n');

process.exit(testsFailed > 0 ? 1 : 0);
