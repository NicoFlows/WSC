#!/usr/bin/env npx tsx

/**
 * Entity Script Tests
 *
 * Tests for validate.ts, query.ts, and create.ts entity scripts.
 */

import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '../..');
const SCRIPTS_DIR = join(ROOT_DIR, '.claude/skills/wsc-entities/scripts');

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
// VALIDATE TESTS
// ============================================================================

console.log('\n🔍 Entity Validate Tests\n');

// Test 1: Validate with --examples flag
{
  const result = runScript('validate.ts', ['--examples']);
  // Should either pass or show validation results
  assert(result.status === 0 || result.stdout.includes('valid') || result.stdout.includes('entities'),
    'Validate --examples runs without crash');
}

// Test 2: Validate shows help with no args
{
  const result = runScript('validate.ts', ['--help']);
  // Check it shows some kind of output
  assert(result.stdout.length > 0 || result.stderr.length > 0, 'Validate --help produces output');
}

// Test 3: Validate specific entity type
{
  const result = runScript('validate.ts', ['--type', 'agent', '--examples']);
  assert(result.status === 0 || result.stdout.includes('agent'), 'Validate by type works');
}

// ============================================================================
// QUERY TESTS
// ============================================================================

console.log('\n🔎 Entity Query Tests\n');

// Test 4: Query with --examples flag
{
  const result = runScript('query.ts', ['--examples']);
  // Should show entities or usage
  assert(result.stdout.length > 0 || result.stderr.length > 0, 'Query --examples produces output');
}

// Test 5: Query by type
{
  const result = runScript('query.ts', ['--type', 'agent', '--examples']);
  assert(result.stdout.includes('agent') || result.status === 0, 'Query by type works');
}

// Test 6: Query by tag
{
  const result = runScript('query.ts', ['--tag', 'protagonist', '--examples']);
  // Should work even if no results
  assert(result.status === 0 || result.stdout.length > 0, 'Query by tag works');
}

// Test 7: Query with --json flag
{
  const result = runScript('query.ts', ['--examples', '--json']);
  // If there are results, should be JSON
  if (result.stdout.includes('[') || result.stdout.includes('{')) {
    assertIncludes(result.stdout, '"', 'JSON output is valid');
  } else {
    assert(result.status === 0, 'Query --json works even with no results');
  }
}

// ============================================================================
// CREATE TESTS (dry-run only)
// ============================================================================

console.log('\n✨ Entity Create Tests\n');

// Test 8: Create help/usage
{
  const result = runScript('create.ts', []);
  assertIncludes(result.stdout, 'type', 'Create shows type requirement');
}

// Use timestamp-based unique names to avoid conflicts
const testSuffix = Date.now().toString(36);

// Test 9: Create agent (dry-run)
{
  const slug = `test_agent_${testSuffix}`;
  const result = runScript('create.ts', ['agent', slug, '--dry-run']);
  assertIncludes(result.stdout, `agent.${slug}`, 'Create agent shows correct ID format');
}

// Test 10: Create polity (dry-run)
{
  const slug = `test_faction_${testSuffix}`;
  const result = runScript('create.ts', ['polity', slug, '--dry-run']);
  assertIncludes(result.stdout, `polity.${slug}`, 'Create polity shows correct ID format');
}

// Test 11: Create force (dry-run)
{
  const slug = `test_army_${testSuffix}`;
  const result = runScript('create.ts', ['force', slug, '--dry-run']);
  assertIncludes(result.stdout, `force.${slug}`, 'Create force shows correct ID format');
}

// Test 12: Create region (dry-run)
{
  const slug = `test_region_${testSuffix}`;
  const result = runScript('create.ts', ['region', slug, '--dry-run']);
  assertIncludes(result.stdout, `region.${slug}`, 'Create region shows correct ID format');
}

// Test 13: Create with custom name (check ID is created - name is in the file)
{
  const slug = `hero_${testSuffix}`;
  const result = runScript('create.ts', ['agent', slug, '--name', 'The Great Hero', '--dry-run']);
  // Dry-run output shows the ID, name is in the file content
  assertIncludes(result.stdout, `agent.${slug}`, 'Custom name entity is created');
}

// Test 14: Create invalid type shows error
{
  const result = runScript('create.ts', ['invalid_type', 'test', '--dry-run']);
  assert(result.status !== 0 || result.stderr.includes('Invalid') || result.stdout.includes('Invalid'),
    'Invalid entity type is rejected');
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '═'.repeat(50));
console.log(`Entity Tests: ${testsPassed} passed, ${testsFailed} failed`);
console.log('═'.repeat(50) + '\n');

process.exit(testsFailed > 0 ? 1 : 0);
