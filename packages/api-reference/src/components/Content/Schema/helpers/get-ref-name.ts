import { REGEX } from '@scalar/helpers/regex/regex-helpers'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { ReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/reference'

/**
 * Gets the "name" of the schema from the ref path
 * TODO: this will change so fix it when the new refs are out
 * Then add tests
 *
 * @example SchemaName from #/components/schemas/SchemaName
 */
export const getRefName = (schema: ReferenceType<SchemaObject>) => {
  const ref = schema.$ref

  if (!ref) {
    return null
  }

  const match = ref.match(REGEX.REF_NAME)
  if (match) {
    return match[1]
  }

  return null
}
