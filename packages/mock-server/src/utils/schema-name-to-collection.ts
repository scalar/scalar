/**
 * Convert a schema name to a collection name.
 * Examples:
 * - "Article" → "articles"
 * - "UserProfile" → "userProfiles"
 * - "User" → "users"
 * - "API" → "apis"
 */
export function schemaNameToCollection(schemaName: string): string {
  if (!schemaName || schemaName.length === 0) {
    return schemaName
  }

  // Handle single character (edge case)
  if (schemaName.length === 1) {
    return `${schemaName.toLowerCase()}s`
  }

  // Check if the entire string is uppercase (acronym)
  if (schemaName === schemaName.toUpperCase()) {
    return `${schemaName.toLowerCase()}s`
  }

  // Find the position where we transition from uppercase to lowercase
  // or where we have multiple consecutive uppercase letters
  let lastUpperCaseIndex = -1
  for (let i = schemaName.length - 1; i >= 0; i--) {
    if (schemaName[i] === schemaName[i]?.toUpperCase()) {
      lastUpperCaseIndex = i
    } else {
      break
    }
  }

  // If the last part is all uppercase (like "API" in "UserAPI"), treat it as acronym
  if (lastUpperCaseIndex >= 0 && lastUpperCaseIndex < schemaName.length - 1) {
    const base = schemaName.slice(0, lastUpperCaseIndex + 1)
    const rest = schemaName.slice(lastUpperCaseIndex + 1)
    return `${base.toLowerCase()}${rest}s`
  }

  // Standard case: convert to camelCase and pluralize
  // Convert first letter to lowercase
  const firstChar = schemaName[0]?.toLowerCase()
  const rest = schemaName.slice(1)

  // Simple pluralization: add 's' (or 'es' for certain endings)
  let plural = `${firstChar}${rest}`

  // Handle common pluralization rules
  if (plural.endsWith('y')) {
    plural = `${plural.slice(0, -1)}ies`
  } else if (
    plural.endsWith('s') ||
    plural.endsWith('sh') ||
    plural.endsWith('ch') ||
    plural.endsWith('x') ||
    plural.endsWith('z')
  ) {
    plural = `${plural}es`
  } else {
    plural = `${plural}s`
  }

  return plural
}
