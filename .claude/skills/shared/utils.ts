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

// =============================================================================
// World Instance Utilities
// =============================================================================

export interface WorldsRegistry {
  active_world: string | null;
  worlds: Record<string, {
    scenario: string;
    name: string;
    created_at: string;
    last_played: string;
  }>;
}

export function getWorldsDir(): string {
  return join(getProjectRoot(), 'src', 'worlds');
}

export function getWorldsRegistry(): WorldsRegistry {
  const registryPath = join(getWorldsDir(), 'worlds.json');
  if (!existsSync(registryPath)) {
    return { active_world: null, worlds: {} };
  }
  return readJson<WorldsRegistry>(registryPath);
}

export function saveWorldsRegistry(registry: WorldsRegistry): void {
  const registryPath = join(getWorldsDir(), 'worlds.json');
  writeJson(registryPath, registry);
}

export function getActiveWorldId(): string | null {
  const registry = getWorldsRegistry();
  return registry.active_world;
}

export function setActiveWorld(worldId: string): void {
  const registry = getWorldsRegistry();
  if (!registry.worlds[worldId]) {
    throw new Error(`World '${worldId}' does not exist`);
  }
  registry.active_world = worldId;
  registry.worlds[worldId].last_played = new Date().toISOString();
  saveWorldsRegistry(registry);
}

/**
 * Get the directory for a specific world instance
 * @param worldId - The world instance ID (e.g., "vega_conflict_001")
 */
export function getWorldInstanceDir(worldId: string): string {
  return join(getWorldsDir(), worldId);
}

/**
 * Get the directory for the currently active world
 * Falls back to legacy src/world if no active world is set
 */
export function getWorldDir(worldId?: string): string {
  const id = worldId || getActiveWorldId();
  if (id) {
    return getWorldInstanceDir(id);
  }
  // Legacy fallback for backwards compatibility
  return join(getProjectRoot(), 'src', 'world');
}

export function getEntitiesDir(worldId?: string): string {
  return join(getWorldDir(worldId), 'entities');
}

export function getLocationsDir(worldId?: string): string {
  return join(getWorldDir(worldId), 'locations');
}

export function getChronicleFile(worldId?: string): string {
  return join(getWorldDir(worldId), 'chronicle.ndjson');
}

export function getStateFile(worldId?: string): string {
  return join(getWorldDir(worldId), 'state.json');
}

export function getExamplesDir(): string {
  return join(getProjectRoot(), 'src', 'examples');
}

export function getScenariosDir(): string {
  return join(getProjectRoot(), 'src', 'scenarios');
}

export function getScenarioDir(scenarioId: string): string {
  return join(getScenariosDir(), scenarioId);
}

/**
 * Generate a unique world ID from a scenario name
 */
export function generateWorldId(scenarioId: string): string {
  const registry = getWorldsRegistry();
  const existingIds = Object.keys(registry.worlds).filter(id => id.startsWith(scenarioId));

  // Find next available number
  let num = 1;
  while (existingIds.includes(`${scenarioId}_${String(num).padStart(3, '0')}`)) {
    num++;
  }

  return `${scenarioId}_${String(num).padStart(3, '0')}`;
}

/**
 * List all world instances
 */
export function listWorlds(): { id: string; scenario: string; name: string; active: boolean }[] {
  const registry = getWorldsRegistry();
  return Object.entries(registry.worlds).map(([id, world]) => ({
    id,
    scenario: world.scenario,
    name: world.name,
    active: registry.active_world === id,
  }));
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
