#!/usr/bin/env npx tsx

/**
 * Create new WSC entity from template
 *
 * Usage:
 *   npx tsx create.ts <type> <slug>
 *   npx tsx create.ts agent captain_vex --name "Captain Vex"
 *   npx tsx create.ts polity merchants_guild --name "Merchants Guild"
 *   npx tsx create.ts --to-examples     # Create in examples instead of world
 */

import { existsSync } from 'fs';
import { join } from 'path';
import {
  EntityTypes,
  type Entity,
  type EntityType,
} from '../../shared/types.js';
import {
  getEntitiesDir,
  getExamplesDir,
  writeJson,
  ensureDir,
  formatSuccess,
  formatError,
} from '../../shared/utils.js';

interface CreateOptions {
  type?: EntityType;
  slug?: string;
  name?: string;
  toExamples?: boolean;
}

function parseArgs(): CreateOptions {
  const args = process.argv.slice(2);
  const options: CreateOptions = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === '--name' && next) {
      options.name = next;
      i++;
    } else if (arg === '--to-examples') {
      options.toExamples = true;
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  if (positional[0] && EntityTypes.includes(positional[0] as EntityType)) {
    options.type = positional[0] as EntityType;
  }
  if (positional[1]) {
    options.slug = positional[1];
  }

  return options;
}

function slugToName(slug: string): string {
  return slug
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function createEntityTemplate(type: EntityType, slug: string, name: string): Entity {
  const id = `${type}.${slug}`;

  const baseEntity = {
    id,
    type,
    name,
    tags: [] as string[],
  };

  switch (type) {
    case 'polity':
      return {
        ...baseEntity,
        attrs: {
          government: 'council',
          ethos: '',
          doctrines: [],
          resources: {
            wealth: 0.5,
            military: 0.5,
            influence: 0.5,
          },
        },
        ai: {
          persona: `${name} is a...`,
          goals: [],
          doctrine: {
            expansion: 0.5,
            diplomacy: 0.5,
            aggression: 0.5,
          },
        },
      };

    case 'region':
      return {
        ...baseEntity,
        attrs: {
          coords: { x: 0, y: 0, z: 0 },
          security: 0.5,
          economy: 0.5,
          population: 1000000,
          hazards: [],
          terrain: 'standard',
        },
      };

    case 'presence':
      return {
        ...baseEntity,
        attrs: {
          polity_id: 'polity.CHANGE_ME',
          region_id: 'region.CHANGE_ME',
          influence: 0.5,
          control: false,
          states_active: [],
          states_pending: [],
          states_cooldown: [],
        },
      };

    case 'force':
      return {
        ...baseEntity,
        attrs: {
          polity_id: 'polity.CHANGE_ME',
          strength: 0.5,
          composition: {
            ships: 10,
            personnel: 500,
          },
          location: 'region.CHANGE_ME',
          stance: 'patrol',
        },
      };

    case 'locale':
      return {
        ...baseEntity,
        attrs: {
          region_id: 'region.CHANGE_ME',
          owner_polity_id: 'polity.CHANGE_ME',
          services: ['market', 'docking'],
          security_level: 0.5,
          locale_type: 'settlement',
        },
      };

    case 'feature':
      return {
        ...baseEntity,
        attrs: {
          region_id: 'region.CHANGE_ME',
          kind: 'natural',
          properties: {
            biome: 'temperate',
            resources: [],
          },
        },
      };

    case 'link':
      return {
        ...baseEntity,
        attrs: {
          from: 'region.CHANGE_ME',
          to: 'region.CHANGE_ME',
          kind: 'trade',
          capacity: 100,
          risk: 0.1,
          bidirectional: true,
        },
      };

    case 'site':
      return {
        ...baseEntity,
        attrs: {
          locale_id: 'locale.CHANGE_ME',
          owner_polity_id: 'polity.CHANGE_ME',
          population: 1000,
          prosperity: 0.5,
          unrest: 0.1,
          hazard: 0.1,
          infrastructure: {},
        },
      };

    case 'agent':
      return {
        ...baseEntity,
        tags: ['npc'],
        attrs: {
          affiliation: 'polity.CHANGE_ME',
          role: 'unknown',
          traits: [],
          relationships: {},
          status: 'active',
          salience: 0.5,
          location: 'locale.CHANGE_ME',
        },
        ai: {
          persona: `${name} is...`,
          voice: {
            tone: 'neutral',
            vocabulary: [],
            speech_patterns: '',
          },
          goals: [],
          memory: [],
          secrets: [],
          emotional_state: {
            mood: 'neutral',
            stress: 0.3,
          },
          skills: {
            combat: 0.5,
            negotiation: 0.5,
          },
          quirks: [],
        },
      };

    case 'holding':
      return {
        ...baseEntity,
        attrs: {
          owner_id: 'agent.CHANGE_ME',
          holding_type: 'asset',
          properties: {},
          location: 'locale.CHANGE_ME',
        },
      };

    default:
      return {
        ...baseEntity,
        attrs: {},
      };
  }
}

async function main() {
  const options = parseArgs();

  if (!options.type || !options.slug) {
    console.log('Usage: npx tsx create.ts <type> <slug> [--name "Display Name"]');
    console.log('');
    console.log('Types:', EntityTypes.join(', '));
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx create.ts agent captain_vex --name "Captain Vex"');
    console.log('  npx tsx create.ts polity merchants_guild');
    console.log('  npx tsx create.ts force raiders_1st');
    process.exit(1);
  }

  const name = options.name || slugToName(options.slug);
  const entity = createEntityTemplate(options.type, options.slug, name);

  const targetDir = options.toExamples
    ? join(getExamplesDir(), 'entities')
    : getEntitiesDir();

  ensureDir(targetDir);

  const filePath = join(targetDir, `${entity.id}.json`);

  if (existsSync(filePath)) {
    console.error(formatError(`Entity already exists: ${filePath}`));
    process.exit(1);
  }

  writeJson(filePath, entity);
  console.log(formatSuccess(`Created ${entity.id}`));
  console.log(`File: ${filePath}`);
  console.log('');
  console.log('Remember to update CHANGE_ME placeholders!');
}

main().catch((err) => {
  console.error(formatError(err.message));
  process.exit(1);
});
