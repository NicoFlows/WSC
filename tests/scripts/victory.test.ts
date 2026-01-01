#!/usr/bin/env npx tsx

/**
 * Victory Condition Checker Tests
 *
 * Tests for check-victory.ts script.
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
    timeout: 15000,
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status || 0,
  };
}

// ============================================================================
// CHECK-VICTORY TESTS
// ============================================================================

console.log('\n🎯 Victory Condition Tests\n');

// Test 1: Check victory with JSON output
{
  const result = runScript('check-victory.ts', ['--json']);
  // Should return valid JSON
  try {
    const json = JSON.parse(result.stdout);
    assert('continue' in json, 'JSON output has continue field');
    assert('status' in json, 'JSON output has status field');
    assert(['running', 'victory', 'stalemate', 'error'].includes(json.status), 'Status is valid value');
  } catch {
    assert(false, 'JSON output is valid JSON');
  }
}

// Test 2: Check victory with verbose output
{
  const result = runScript('check-victory.ts', ['--verbose']);
  assertIncludes(result.stdout, 'Victory Check', 'Verbose output shows header');
  assertIncludes(result.stdout, 'entities', 'Verbose output shows entity count');
  assertIncludes(result.stdout, 'tick', 'Verbose output shows tick');
}

// Test 3: Check victory shows condition evaluation
{
  const result = runScript('check-victory.ts', ['--verbose']);
  assertIncludes(result.stdout, 'Checking victory conditions', 'Shows condition checking');
}

// Test 4: Non-JSON output shows human-readable result
{
  const result = runScript('check-victory.ts', []);
  // Should show either "continues" or victory message
  assert(
    result.stdout.includes('continues') ||
    result.stdout.includes('VICTORY') ||
    result.stdout.includes('STALEMATE'),
    'Shows human-readable result'
  );
}

// Test 5: Exit code 0 means continue simulation
{
  const result = runScript('check-victory.ts', ['--json']);
  const json = JSON.parse(result.stdout);
  if (json.continue === true) {
    assert(result.status === 0, 'Exit code 0 for continue=true');
  }
}

// Test 6: JSON output includes details
{
  const result = runScript('check-victory.ts', ['--json']);
  const json = JSON.parse(result.stdout);
  if (json.status === 'running') {
    assert('details' in json, 'Running status includes details');
    assert('tick' in json.details, 'Details includes current tick');
  }
}

// Test 7: Verbose shows entity attribute values
{
  const result = runScript('check-victory.ts', ['--verbose']);
  // Should show the actual values being evaluated
  assert(
    result.stdout.includes('influence') ||
    result.stdout.includes('strength') ||
    result.stdout.includes('condition_met'),
    'Verbose shows attribute values'
  );
}

// Test 8: Script handles missing world gracefully
{
  const result = runScript('check-victory.ts', ['--world', 'nonexistent_world_xyz']);
  assert(result.status !== 0, 'Non-zero exit for missing world');
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '═'.repeat(50));
console.log(`Victory Tests: ${testsPassed} passed, ${testsFailed} failed`);
console.log('═'.repeat(50) + '\n');

process.exit(testsFailed > 0 ? 1 : 0);
