/** The legacy -> updated CSS variable prefix pairs */
export const PREFIX_MIGRATIONS = [
  ['--theme-', '--scalar-'],
  ['--sidebar-', '--scalar-sidebar-'],
  ['--header-', '--scalar-header-'],
]

export const LEGACY_PREFIXES = PREFIX_MIGRATIONS.map(([legacy]) => legacy)

/**
 * Checks a style string for legacy theme variables and updated them to the new theme variables
 *
 * @param styles the style string to be checked for legacy theme variables and updated
 */
export function migrateThemeVariables(styles: string): string {
  const hasLegacyPrefixes = LEGACY_PREFIXES.some((p) => styles.includes(p))
  if (!hasLegacyPrefixes) return styles

  // Replaces each old variable in the prefix migrations
  return PREFIX_MIGRATIONS.reduce((s, [o, n]) => s.replaceAll(o, n), styles)
}
