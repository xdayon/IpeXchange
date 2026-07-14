import { describe, expect, it } from 'vitest';
import {
  assertInitialMigrationSafe,
  DESTRUCTIVE_INITIAL_MIGRATION_CONFIRMATION,
  postgrestInPath,
} from './db-safety.js';

const migration = '0001_init.sql';

describe('assertInitialMigrationSafe', () => {
  it('allows a fresh public schema', () => {
    expect(() => assertInitialMigrationSafe({
      initialMigration: migration,
      appliedMigrations: [],
      existingRelations: [],
    })).not.toThrow();
  });

  it('allows an already tracked initial migration', () => {
    expect(() => assertInitialMigrationSafe({
      initialMigration: migration,
      appliedMigrations: [migration],
      existingRelations: ['users'],
    })).not.toThrow();
  });

  it('fails closed when an existing schema has no initial migration record', () => {
    expect(() => assertInitialMigrationSafe({
      initialMigration: migration,
      appliedMigrations: [],
      existingRelations: ['intents', 'users'],
      confirmation: 'yes',
    })).toThrow(/Refusing to run the destructive initial migration/);
  });

  it('requires the exact destructive initialization confirmation', () => {
    expect(() => assertInitialMigrationSafe({
      initialMigration: migration,
      appliedMigrations: [],
      existingRelations: ['users'],
      confirmation: DESTRUCTIVE_INITIAL_MIGRATION_CONFIRMATION,
    })).not.toThrow();
  });
});

describe('postgrestInPath', () => {
  it('builds an exact, deduplicated filter for seed-owned records', () => {
    expect(postgrestInPath('trade_cycles', 'id', ['one', 'two', 'one']))
      .toBe('/trade_cycles?id=in.%28one%2Ctwo%29');
  });

  it('does not build an unbounded delete path', () => {
    expect(postgrestInPath('trade_cycles', 'id', [])).toBeNull();
  });
});
