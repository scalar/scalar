/** The legacy CSS variable prefix */
export const LEGACY_VAR_PREFIX = '--theme-'

/** The new CSS variable prefix */
export const VAR_PREFIX = '--scalar-'

/**
 * Checks a style string for legacy theme variables and updated them to the new theme variables
 *
 * @param styles the style string to be checked for legacy theme variables and updated
 */
export function migrateThemeVariables(styles: string): string {
  if (!styles.includes(LEGACY_VAR_PREFIX)) return styles

  console.warn(
    `DEPRECATION WARNING: It looks like you're using legacy ${LEGACY_VAR_PREFIX}* CSS variables in your custom CSS string. Please migrate them to use the ${VAR_PREFIX}* prefix.`,
  )

  return styles.replaceAll(LEGACY_VAR_PREFIX, VAR_PREFIX)
}
