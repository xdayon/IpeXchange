export const DESTRUCTIVE_INITIAL_MIGRATION_CONFIRMATION =
  'APPLY_0001_TO_EXISTING_DATABASE';

export function assertInitialMigrationSafe({
  initialMigration,
  appliedMigrations,
  existingRelations,
  confirmation,
}) {
  if (appliedMigrations.includes(initialMigration) || existingRelations.length === 0) {
    return;
  }
  if (confirmation === DESTRUCTIVE_INITIAL_MIGRATION_CONFIRMATION) return;

  const preview = existingRelations.slice(0, 8).join(', ');
  const more = existingRelations.length > 8 ? ', ...' : '';
  throw new Error(
    `${initialMigration} is not recorded, but public schema objects already exist ` +
      `(${preview}${more}). Refusing to run the destructive initial migration. ` +
      `After verifying the target and backups, set DB_APPLY_CONFIRM=` +
      `${DESTRUCTIVE_INITIAL_MIGRATION_CONFIRMATION} to proceed.`,
  );
}

export function postgrestInPath(resource, column, values, select) {
  const unique = [...new Set(values)];
  if (unique.length === 0) return null;
  const params = new URLSearchParams();
  params.set(column, `in.(${unique.join(',')})`);
  if (select) params.set('select', select);
  return `/${resource}?${params}`;
}
