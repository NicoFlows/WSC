import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { glob } from 'glob';

// =============================================================================
// Path Utilities
// =============================================================================

let cachedProjectRoot: string | null = null;

export function getProjectRoot(): string {
  if (cachedProjectRoot) return cachedProjectRoot;

  // Start from cwd and search upward for package.json
  let dir = process.cwd();
  while (dir !== '/') {
    if (existsSync(join(dir, 'package.json'))) {
      // Verify it's a WSC project by checking for .claude/skills
      if (existsSync(join(dir, '.claude', 'skills'))) {
        cachedProjectRoot = dir;
        return dir;
      }
    }
    dir = dirname(dir);
  }

  // Fallback to cwd
  cachedProjectRoot = process.cwd();
  return cachedProjectRoot;
}

export function getWorldDir(): string {
  return join(getProjectRoot(), 'src', 'world');
}

export function getEntitiesDir(): string {
  return join(getWorldDir(), 'entities');
}

export function getExamplesDir(): string {
  return join(getProjectRoot(), 'src', 'examples');
}

export function getChronicleFile(): string {
  return join(getWorldDir(), 'chronicle.ndjson');
}

export function getStateFile(): string {
  return join(getWorldDir(), 'state.json');
}

// =============================================================================
// File Utilities
// =============================================================================

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function readJson<T>(path: string): T {
  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content) as T;
}

export function writeJson(path: string, data: unknown, pretty = true): void {
  ensureDir(dirname(path));
  const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  writeFileSync(path, content + '\n', 'utf-8');
}

export function appendNdjson(path: string, data: unknown): void {
  ensureDir(dirname(path));
  const line = JSON.stringify(data) + '\n';
  if (existsSync(path)) {
    appendFileSync(path, line, 'utf-8');
  } else {
    writeFileSync(path, line, 'utf-8');
  }
}

export async function findFiles(pattern: string, cwd?: string): Promise<string[]> {
  return glob(pattern, { cwd: cwd || getProjectRoot(), absolute: true });
}

// =============================================================================
// Entity Utilities
// =============================================================================

export function entityIdToFilename(id: string): string {
  return `${id}.json`;
}

export function filenameToEntityId(filename: string): string {
  return filename.replace(/\.json$/, '');
}

export function parseEntityId(id: string): { type: string; slug: string } {
  const [type, ...rest] = id.split('.');
  return { type, slug: rest.join('.') };
}

// =============================================================================
// Output Utilities
// =============================================================================

export function formatTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] || '').length))
  );

  const line = (cells: string[]) =>
    cells.map((c, i) => c.padEnd(widths[i])).join('  ');

  const separator = widths.map(w => '-'.repeat(w)).join('  ');

  return [line(headers), separator, ...rows.map(line)].join('\n');
}

export function formatSuccess(message: string): string {
  return `✓ ${message}`;
}

export function formatError(message: string): string {
  return `✗ ${message}`;
}

export function formatWarning(message: string): string {
  return `⚠ ${message}`;
}
