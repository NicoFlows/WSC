#!/usr/bin/env npx tsx

/**
 * Validate WSC entity files against schema
 *
 * Usage:
 *   npx tsx validate.ts <entity-file-or-id>
 *   npx tsx validate.ts src/world/entities/agent.captain_reva.json
 *   npx tsx validate.ts agent.captain_reva
 *   npx tsx validate.ts --all                    # Validate all entities
 *   npx tsx validate.ts --examples               # Validate example entities
 */

import { existsSync } from 'fs';
import { join, basename } from 'path';
import {
  EntitySchema,
  EntityTypes,
  type Entity,
  type ValidationResult,
} from '../../shared/types.js';
import {
  getEntitiesDir,
  getExamplesDir,
  readJson,
  findFiles,
  formatSuccess,
  formatError,
  formatWarning,
  parseEntityId,
} from '../../shared/utils.js';

interface ValidateOptions {
  all?: boolean;
  examples?: boolean;
  files: string[];
}

function parseArgs(): ValidateOptions {
  const args = process.argv.slice(2);
  const options: ValidateOptions = { files: [] };

  for (const arg of args) {
    if (arg === '--all') {
      options.all = true;
    } else if (arg === '--examples') {
      options.examples = true;
    } else if (!arg.startsWith('-')) {
      options.files.push(arg);
    }
  }

  return options;
}

function resolveEntityPath(input: string): string | null {
  // If it's already a path
  if (input.endsWith('.json')) {
    if (existsSync(input)) return input;
    return null;
  }

  // Try as entity ID
  const worldPath = join(getEntitiesDir(), `${input}.json`);
  if (existsSync(worldPath)) return worldPath;

  const examplesPath = join(getExamplesDir(), 'entities', `${input}.json`);
  if (existsSync(examplesPath)) return examplesPath;

  return null;
}

function validateEntity(entity: unknown): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Parse with Zod
  const parseResult = EntitySchema.safeParse(entity);

  if (!parseResult.success) {
    result.valid = false;
    for (const issue of parseResult.error.issues) {
      const path = issue.path.join('.');
      result.errors.push(`${path}: ${issue.message}`);
    }
    return result;
  }

  const data = parseResult.data;

  // Additional semantic validations
  validateEntityId(data, result);
  validateReferences(data, result);
  validateAIBlock(data, result);

  return result;
}

function validateEntityId(entity: Entity, result: ValidationResult): void {
  const { type, slug } = parseEntityId(entity.id);

  if (type !== entity.type) {
    result.errors.push(
      `ID prefix '${type}' doesn't match type '${entity.type}'`
    );
    result.valid = false;
  }

  if (!slug || slug.length === 0) {
    result.errors.push('Entity ID missing slug after type prefix');
    result.valid = false;
  }
}

function validateReferences(entity: Entity, result: ValidationResult): void {
  // Check common reference fields exist and have valid format
  const attrs = entity.attrs as Record<string, unknown>;

  const refFields = [
    'affiliation',
    'polity_id',
    'region_id',
    'locale_id',
    'owner_id',
    'owner_polity_id',
    'location',
  ];

  for (const field of refFields) {
    const value = attrs[field];
    if (typeof value === 'string' && value.length > 0) {
      if (!value.includes('.')) {
        result.warnings.push(
          `Reference '${field}' value '${value}' may be missing type prefix`
        );
      }
    }
  }

  // Validate relationships if present
  if (attrs.relationships && typeof attrs.relationships === 'object') {
    const rels = attrs.relationships as Record<string, unknown>;
    for (const targetId of Object.keys(rels)) {
      if (!targetId.includes('.')) {
        result.warnings.push(
          `Relationship target '${targetId}' may be missing type prefix`
        );
      }
    }
  }
}

function validateAIBlock(entity: Entity, result: ValidationResult): void {
  if (!entity.ai) return;

  // Agents and polities should have persona
  if ((entity.type === 'agent' || entity.type === 'polity') && !entity.ai.persona) {
    result.warnings.push(
      `${entity.type} entities typically benefit from an 'ai.persona' field`
    );
  }

  // Check goals are strings
  if (entity.ai.goals) {
    for (const goal of entity.ai.goals) {
      if (typeof goal !== 'string') {
        result.errors.push(`Goal must be a string: ${JSON.stringify(goal)}`);
        result.valid = false;
      }
    }
  }

  // Check skill values in range
  if (entity.ai.skills) {
    for (const [skill, value] of Object.entries(entity.ai.skills)) {
      if (typeof value === 'number' && (value < 0 || value > 1)) {
        result.warnings.push(
          `Skill '${skill}' value ${value} is outside typical 0-1 range`
        );
      }
    }
  }
}

async function validateFile(filePath: string): Promise<{ path: string; result: ValidationResult }> {
  try {
    const entity = readJson<unknown>(filePath);
    const result = validateEntity(entity);
    return { path: filePath, result };
  } catch (err) {
    return {
      path: filePath,
      result: {
        valid: false,
        errors: [`Failed to read/parse file: ${err instanceof Error ? err.message : String(err)}`],
        warnings: [],
      },
    };
  }
}

async function main() {
  const options = parseArgs();

  let files: string[] = [];

  if (options.all) {
    const worldFiles = await findFiles('src/world/entities/**/*.json');
    files.push(...worldFiles);
  }

  if (options.examples) {
    const exampleFiles = await findFiles('src/examples/entities/**/*.json');
    files.push(...exampleFiles);
  }

  for (const input of options.files) {
    const resolved = resolveEntityPath(input);
    if (resolved) {
      files.push(resolved);
    } else {
      console.error(formatError(`Could not find entity: ${input}`));
    }
  }

  if (files.length === 0) {
    console.log('Usage: npx tsx validate.ts <entity-file-or-id>');
    console.log('       npx tsx validate.ts --all');
    console.log('       npx tsx validate.ts --examples');
    process.exit(1);
  }

  // Remove duplicates
  files = [...new Set(files)];

  let totalValid = 0;
  let totalInvalid = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const { path, result } = await validateFile(file);
    const name = basename(path, '.json');

    if (result.valid && result.warnings.length === 0) {
      console.log(formatSuccess(`${name}`));
      totalValid++;
    } else if (result.valid) {
      console.log(formatWarning(`${name}`));
      for (const warning of result.warnings) {
        console.log(`  ⚠ ${warning}`);
      }
      totalValid++;
      totalWarnings += result.warnings.length;
    } else {
      console.log(formatError(`${name}`));
      for (const error of result.errors) {
        console.log(`  ✗ ${error}`);
      }
      for (const warning of result.warnings) {
        console.log(`  ⚠ ${warning}`);
      }
      totalInvalid++;
      totalWarnings += result.warnings.length;
    }
  }

  console.log('');
  console.log(`Summary: ${totalValid} valid, ${totalInvalid} invalid, ${totalWarnings} warnings`);

  process.exit(totalInvalid > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(formatError(err.message));
  process.exit(1);
});
