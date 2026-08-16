import { REGEX } from '@scalar/helpers/regex/regex-helpers'

/**
 * Gets the "name" of the schema from the ref path
 * TODO: this will change so fix it when the new refs are out
 * Then add tests
 *
 * @example SchemaName from #/components/schemas/SchemaName
 */
export const getRefName = (ref: string) => {
  if (!ref) {
    return null
  }

  const match = ref.match(REGEX.REF_NAME)
  if (match) {
    return match[1]
  }

  return null
}

/**
 * Matches a local reference that points at `#/components/schemas/<name>` and
 * captures the schema name. Intentionally strict: only refs that resolve to a
 * navigable model in `components.schemas` should be linkable.
 */
const COMPONENTS_SCHEMAS_REF = /^#\/components\/schemas\/([^/]+)$/

/**
 * Gets the models-section key for a `$ref`, but only when the ref actually
 * targets `#/components/schemas/`.
 *
 * The models index used for navigation is built exclusively from
 * `components.schemas`, so a ref into any other bucket (`parameters`,
 * `responses`, ...) or an external file (`./other.yaml#/Foo`) has no navigable
 * target. Returning `null` for those keeps the name visible as plain text while
 * avoiding a dead link.
 *
 * @example
 * getSchemaRefName('#/components/schemas/Planet') // 'Planet'
 * getSchemaRefName('#/components/parameters/Planet') // null
 * getSchemaRefName('./planets.yaml#/Planet') // null
 */
export const getSchemaRefName = (ref: string): string | null => {
  if (!ref) {
    return null
  }

  const match = ref.match(COMPONENTS_SCHEMAS_REF)
  if (match?.[1]) {
    return decodeURIComponent(match[1])
  }

  return null
}
