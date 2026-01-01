#!/usr/bin/env npx tsx

/**
 * WSC Test Runner
 *
 * Runs all script tests and reports results.
 *
 * Usage:
 *   npx tsx tests/run-tests.ts              # Run all tests
 *   npx tsx tests/run-tests.ts --suite chronicle  # Run specific suite
 *   npx tsx tests/run-tests.ts --verbose    # Show detailed output
 */

import { execSync, spawnSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  output?: string;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
}

// Parse arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const suiteFilter = args.find((a, i) => args[i - 1] === '--suite');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(msg: string) {
  console.log(msg);
}

function runTest(testFile: string): TestResult {
  const name = testFile.replace('.test.ts', '');
  const startTime = Date.now();

  try {
    const result = spawnSync('npx', ['tsx', testFile], {
      cwd: join(__dirname, 'scripts'),
      encoding: 'utf-8',
      timeout: 30000,
      env: {
        ...process.env,
        WSC_TEST_MODE: 'true',
      },
    });

    const duration = Date.now() - startTime;
    const output = result.stdout + result.stderr;

    if (result.status === 0) {
      return { name, passed: true, duration, output: verbose ? output : undefined };
    } else {
      return { name, passed: false, duration, error: output };
    }
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const error = err instanceof Error ? err.message : String(err);
    return { name, passed: false, duration, error };
  }
}

function runSuite(suiteName: string): TestSuite {
  const suiteDir = join(__dirname, 'scripts');
  const tests: TestResult[] = [];

  if (!existsSync(suiteDir)) {
    return { name: suiteName, tests: [] };
  }

  const testFiles = readdirSync(suiteDir)
    .filter(f => f.endsWith('.test.ts'))
    .filter(f => !suiteFilter || f.startsWith(suiteFilter));

  for (const file of testFiles) {
    const result = runTest(file);
    tests.push(result);

    // Print result immediately
    const icon = result.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    const time = `${colors.dim}(${result.duration}ms)${colors.reset}`;
    log(`  ${icon} ${result.name} ${time}`);

    if (!result.passed && result.error) {
      log(`    ${colors.red}${result.error.split('\n').slice(0, 5).join('\n    ')}${colors.reset}`);
    }

    if (result.passed && result.output && verbose) {
      log(`    ${colors.dim}${result.output.split('\n').slice(0, 3).join('\n    ')}${colors.reset}`);
    }
  }

  return { name: suiteName, tests };
}

function printSummary(suites: TestSuite[]) {
  log('');
  log(`${colors.bold}═══════════════════════════════════════${colors.reset}`);
  log(`${colors.bold}  Test Summary${colors.reset}`);
  log(`${colors.bold}═══════════════════════════════════════${colors.reset}`);

  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of suites) {
    const passed = suite.tests.filter(t => t.passed).length;
    const failed = suite.tests.filter(t => !t.passed).length;
    totalPassed += passed;
    totalFailed += failed;

    if (suite.tests.length > 0) {
      const status = failed === 0 ? colors.green : colors.red;
      log(`  ${suite.name}: ${status}${passed}/${suite.tests.length} passed${colors.reset}`);
    }
  }

  log('');
  if (totalFailed === 0) {
    log(`${colors.green}${colors.bold}  All ${totalPassed} tests passed!${colors.reset}`);
  } else {
    log(`${colors.red}${colors.bold}  ${totalFailed} test(s) failed${colors.reset}`);
  }
  log('');

  return totalFailed === 0;
}

async function main() {
  log('');
  log(`${colors.bold}WSC Test Runner${colors.reset}`);
  log(`${colors.dim}Running from: ${ROOT_DIR}${colors.reset}`);
  log('');

  const suites: TestSuite[] = [];

  // Run script tests
  log(`${colors.blue}Script Tests${colors.reset}`);
  suites.push(runSuite('scripts'));

  const success = printSummary(suites);
  process.exit(success ? 0 : 1);
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
