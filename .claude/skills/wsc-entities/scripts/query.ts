#!/usr/bin/env npx tsx

/**
 * Query WSC entities by type, tag, relationship, or location
 *
 * Usage:
 *   npx tsx query.ts --list                           # List all entities
 *   npx tsx query.ts --type agent                     # Filter by type
 *   npx tsx query.ts --tag veteran                    # Filter by tag
 *   npx tsx query.ts --belongs-to polity.hegemony     # Filter by affiliation
 *   npx tsx query.ts --location region.vega           # Filter by location
 *   npx tsx query.ts --type force --belongs-to polity.free_traders
 *   npx tsx query.ts --examples                       # Query example entities
 *   npx tsx query.ts --json                           # Output as JSON
 */

import { existsSync } from 'fs';
import { join, basename } from 'path';
import {
  EntityTypes,
  type Entity,
  type EntityType,
} from '../../shared/types.js';
import {
  getEntitiesDir,
  getExamplesDir,
  readJson,
  findFiles,
  formatTable,
  parseEntityId,
} from '../../shared/utils.js';

interface QueryOptions {
  list?: boolean;
  type?: EntityType;
  tags?: string[];
  belongsTo?: string;
  location?: string;
  examples?: boolean;
  json?: boolean;
  limit?: number;
}

function parseArgs(): QueryOptions {
  const args = process.argv.slice(2);
  const options: QueryOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--list':
        options.list = true;
        break;
      case '--type':
        if (next && EntityTypes.includes(next as EntityType)) {
          options.type = next as EntityType;
          i++;
        }
        break;
      case '--tag':
        if (next) {
          options.tags = options.tags || [];
          options.tags.push(next);
          i++;
        }
        break;
      case '--belongs-to':
        if (next) {
          options.belongsTo = next;
          i++;
        }
        break;
      case '--location':
        if (next) {
          options.location = next;
          i++;
        }
        break;
      case '--examples':
        options.examples = true;
        break;
      case '--json':
        options.json = true;
        break;
      case '--limit':
        if (next) {
          options.limit = parseInt(next, 10);
          i++;
        }
        break;
    }
  }

  return options;
}

function matchesQuery(entity: Entity, options: QueryOptions): boolean {
  // Type filter
  if (options.type && entity.type !== options.type) {
    return false;
  }

  // Tag filter (must have ALL specified tags)
  if (options.tags && options.tags.length > 0) {
    const entityTags = entity.tags || [];
    for (const tag of options.tags) {
      if (!entityTags.includes(tag)) {
        return false;
      }
    }
  }

  const attrs = entity.attrs as Record<string, unknown>;

  // Belongs-to filter (affiliation, polity_id, owner)
  if (options.belongsTo) {
    const affiliations = [
      attrs.affiliation,
      attrs.polity_id,
      attrs.owner_id,
      attrs.owner_polity_id,
    ].filter(Boolean);

    if (!affiliations.includes(options.belongsTo)) {
      return false;
    }
  }

  // Location filter
  if (options.location) {
    const locations = [
      attrs.location,
      attrs.region_id,
      attrs.locale_id,
      attrs.where,
    ].filter(Boolean);

    // Also check if entity's location is within the specified location
    const locationMatches = locations.some(
      (loc) => loc === options.location || String(loc).startsWith(options.location + '.')
    );

    if (!locationMatches) {
      return false;
    }
  }

  return true;
}

async function loadEntities(options: QueryOptions): Promise<Entity[]> {
  const entities: Entity[] = [];

  // Determine which directories to search
  const dirs: string[] = [];

  if (options.examples) {
    dirs.push(join(getExamplesDir(), 'entities'));
  } else {
    const worldDir = getEntitiesDir();
    if (existsSync(worldDir)) {
      dirs.push(worldDir);
    }
    // Fall back to examples if world is empty
    if (dirs.length === 0 || !(await findFiles('*.json', dirs[0])).length) {
      dirs.push(join(getExamplesDir(), 'entities'));
    }
  }

  for (const dir of dirs) {
    const files = await findFiles('**/*.json', dir);
    for (const file of files) {
      try {
        const entity = readJson<Entity>(file);
        if (entity.id && entity.type) {
          entities.push(entity);
        }
      } catch {
        // Skip invalid files
      }
    }
  }

  return entities;
}

function formatEntityRow(entity: Entity): string[] {
  const attrs = entity.attrs as Record<string, unknown>;

  // Get relevant info based on type
  let info = '';
  switch (entity.type) {
    case 'agent':
      info = String(attrs.affiliation || attrs.role || '');
      break;
    case 'force':
      info = `${attrs.polity_id} @ ${attrs.location}`;
      break;
    case 'presence':
      info = `influence: ${attrs.influence}`;
      break;
    case 'locale':
    case 'feature':
      info = String(attrs.region_id || '');
      break;
    case 'site':
      info = String(attrs.locale_id || '');
      break;
    case 'holding':
      info = String(attrs.owner_id || '');
      break;
    default:
      info = (entity.tags || []).slice(0, 3).join(', ');
  }

  return [entity.id, entity.type, entity.name, info];
}

async function main() {
  const options = parseArgs();

  // Default to list if no filters specified
  if (!options.type && !options.tags && !options.belongsTo && !options.location) {
    options.list = true;
  }

  const entities = await loadEntities(options);
  let results = entities.filter((e) => matchesQuery(e, options));

  // Apply limit
  if (options.limit && options.limit > 0) {
    results = results.slice(0, options.limit);
  }

  if (results.length === 0) {
    console.log('No entities found matching query.');
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    const headers = ['ID', 'Type', 'Name', 'Info'];
    const rows = results.map(formatEntityRow);
    console.log(formatTable(headers, rows));
    console.log(`\n${results.length} entities found.`);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
