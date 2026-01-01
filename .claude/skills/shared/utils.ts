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

// =============================================================================
// Location Resolution Utilities
// =============================================================================

export interface WhereLocation {
  scale?: string;
  system?: string;
  body?: string;
  locale?: string;
  site?: string;
  orbit_au?: number;
  coords?: { x: number; y: number; z?: number };
  hierarchy?: string[];
}

interface LocationFile {
  id: string;
  name: string;
  type?: string;
  scale?: string;
  hierarchy?: {
    parent?: {
      location_id?: string;
      anchor?: {
        coords?: { x: number; y: number; z?: number };
        orbit?: number;
      };
    };
    children?: Array<{
      location_id?: string;
      anchor?: {
        orbit?: number;
        body_type?: string;
      };
    }>;
  };
  entity_id?: string;
  geometry?: {
    data?: {
      orbits?: Array<{
        slot: number;
        distance_au: number;
        bodies?: Array<{
          id: string;
          name: string;
          type: string;
        }>;
      }>;
    };
  };
}

/**
 * Find a location file that matches an entity ID
 * Entity IDs like "locale.port_nexus" may map to location files like "locale.port_nexus.json"
 */
export function findLocationFile(entityId: string, worldId?: string): string | null {
  const locationsDir = getLocationsDir(worldId);
  if (!existsSync(locationsDir)) {
    return null;
  }

  // Try direct match first (e.g., locale.port_nexus -> locale.port_nexus.json)
  const directPath = join(locationsDir, `${entityId}.json`);
  if (existsSync(directPath)) {
    return directPath;
  }

  // Try with location. prefix
  const prefixPath = join(locationsDir, `location.${entityId}.json`);
  if (existsSync(prefixPath)) {
    return prefixPath;
  }

  // Search for file containing this entity_id
  const files = readdirSync(locationsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const content = readJson<LocationFile>(join(locationsDir, file));
      if (content.entity_id === entityId) {
        return join(locationsDir, file);
      }
    } catch {
      // Skip invalid files
    }
  }

  return null;
}

/**
 * Resolve location coordinates from a location file and its hierarchy
 */
export function resolveLocationCoords(locationPath: string, worldId?: string): WhereLocation {
  const location = readJson<LocationFile>(locationPath);
  const result: WhereLocation = {
    scale: location.scale || location.type,
    hierarchy: [],
  };

  // Build hierarchy path and extract coordinates
  const visited = new Set<string>();
  let current: LocationFile | null = location;
  let currentPath = locationPath;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    result.hierarchy!.unshift(current.id);

    // Extract info based on scale
    const scale = current.scale || current.type || '';
    if (scale === 'system' || scale.includes('system')) {
      result.system = current.name;
    } else if (scale === 'body' || scale.includes('body') || scale.includes('planet') || scale.includes('station')) {
      result.body = current.name;
    } else if (scale === 'locale' || scale.includes('locale')) {
      result.locale = current.name;
    } else if (scale === 'site' || scale.includes('site') || scale.includes('district')) {
      result.site = current.name;
    }

    // Try to get coordinates from hierarchy anchor
    if (current.hierarchy?.parent?.anchor?.coords) {
      result.coords = current.hierarchy.parent.anchor.coords;
    }

    // Try to get orbit distance
    if (current.hierarchy?.parent?.anchor?.orbit) {
      const orbitSlot = current.hierarchy.parent.anchor.orbit;
      // Look up orbit distance from parent's geometry if available
      const parentId = current.hierarchy?.parent?.location_id;
      if (parentId) {
        const parentPath = findLocationFile(parentId.replace('location.', ''), worldId);
        if (parentPath) {
          try {
            const parent = readJson<LocationFile>(parentPath);
            const orbitData = parent.geometry?.data?.orbits?.find(o => o.slot === orbitSlot);
            if (orbitData?.distance_au) {
              result.orbit_au = orbitData.distance_au;
            }
          } catch {
            // Ignore errors reading parent
          }
        }
      }
    }

    // Move to parent
    const parentId = current.hierarchy?.parent?.location_id;
    if (parentId) {
      const parentPath = findLocationFile(parentId.replace('location.', ''), worldId);
      if (parentPath && !visited.has(parentId)) {
        try {
          current = readJson<LocationFile>(parentPath);
          currentPath = parentPath;
        } catch {
          current = null;
        }
      } else {
        current = null;
      }
    } else {
      current = null;
    }
  }

  return result;
}

/**
 * Resolve location data for an entity ID
 * Returns null if no location data can be found
 */
export function resolveWhereLocation(entityId: string, worldId?: string): WhereLocation | null {
  const locationPath = findLocationFile(entityId, worldId);
  if (!locationPath) {
    return null;
  }

  try {
    return resolveLocationCoords(locationPath, worldId);
  } catch {
    return null;
  }
}
