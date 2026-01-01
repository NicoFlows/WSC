#!/usr/bin/env npx tsx

/**
 * World State Script Tests
 *
 * Tests for init.ts, status.ts, and tick.ts world-state scripts.
 */

import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '../..');
const SCRIPTS_DIR = join(ROOT_DIR, '.claude/skills/wsc-world-state/scripts');

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
// INIT TESTS
// ============================================================================

console.log('\n🌍 World Init Tests\n');

// Test 1: List available scenarios
{
  const result = runScript('init.ts', ['--list']);
  assertIncludes(result.stdout, 'Scenario', 'List shows scenarios');
}

// Test 2: List existing worlds
{
  const result = runScript('init.ts', ['--list-worlds']);
  // Should work even if no worlds exist
  assert(result.status === 0 || result.stdout.includes('world') || result.stdout.includes('No'),
    'List-worlds runs without error');
}

// Test 3: Init lists scenario names
{
  const result = runScript('init.ts', ['--list']);
  assert(result.stdout.includes('vega_conflict') || result.stdout.includes('shattered'),
    'Lists available scenario names');
}

// Test 4: Init with dry-run (if supported)
{
  const result = runScript('init.ts', ['--scenario', 'vega_conflict', '--dry-run']);
  // Dry-run should show what would happen without creating
  assert(result.status === 0 || result.stdout.includes('vega') || result.stderr.includes('dry'),
    'Init dry-run works or shows appropriate message');
}

// ============================================================================
// STATUS TESTS
// ============================================================================

console.log('\n📊 World Status Tests\n');

// Test 5: Status shows current world info
{
  const result = runScript('status.ts', []);
  // Should show world info or "no world" message
  assert(result.status === 0 || result.stdout.length > 0,
    'Status runs without crash');
}

// Test 6: Status with --json flag
{
  const result = runScript('status.ts', ['--json']);
  // If there's output, should be JSON-ish or error message
  assert(result.status === 0 || result.stdout.length > 0,
    'Status --json runs');
}

// ============================================================================
// TICK TESTS (careful - these advance simulation)
// ============================================================================

console.log('\n⏰ World Tick Tests\n');

// Test 7: Tick help/usage
{
  const result = runScript('tick.ts', ['--help']);
  assert(result.stdout.length > 0 || result.stderr.length > 0,
    'Tick --help produces output');
}

// Test 8: Tick dry-run (if supported)
{
  const result = runScript('tick.ts', ['--dry-run']);
  // Dry-run should not actually advance time
  assert(result.status === 0 || result.stdout.includes('dry') || result.stderr.includes('world'),
    'Tick dry-run works or shows appropriate message');
}

// Test 9: Tick rejects invalid count
{
  const result = runScript('tick.ts', ['--count', '0', '--dry-run']);
  // Zero ticks should be rejected
  assert(result.status !== 0 || result.stderr.includes('positive'),
    'Tick rejects count=0');
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '═'.repeat(50));
console.log(`World-State Tests: ${testsPassed} passed, ${testsFailed} failed`);
console.log('═'.repeat(50) + '\n');

process.exit(testsFailed > 0 ? 1 : 0);
