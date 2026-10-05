import { resolve } from '@/resolve'
import type { SchemaObject } from '@/schemas/v3.2/strict/openapi-document'
import type { MaybeRefSchemaObject } from '@/schemas/v3.2/strict/schema'

import { unpackProxyShallow } from './unpack-proxy'

const annotationKeys = new Set([
  'title',
  'description',
  'default',
  'examples',
  'example',
  'deprecated',
  'readOnly',
  'writeOnly',
  '$comment',
  'externalDocs',
  // TypeBox marks schemas without an explicit type; this does not constrain their value.
  '__scalar_',
])

/**
 * Expose the value schema inside an annotation-only allOf wrapper for form editors and serializers.
 * Multiple value schemas retain their composition, since combining their constraints requires more
 * than spreading their keywords. The returned view does not mutate the API description.
 */
export const resolveSchemaWithAnnotations = (schema: MaybeRefSchemaObject | undefined): SchemaObject | undefined => {
  const seen = new Set<object>()
  const visit = (input: MaybeRefSchemaObject | undefined): SchemaObject | undefined => {
    const resolved = resolve.schema(input)
    if (!resolved?.allOf?.length || !input) {
      return resolved
    }
    if (Object.keys(resolved).some((key) => key !== 'allOf' && key !== '$ref' && !annotationKeys.has(key))) {
      return resolved
    }
    const identity = unpackProxyShallow(input)
    if (seen.has(identity)) {
      return resolved
    }
    seen.add(identity)

    const members = resolved.allOf.map((member) => resolve.schema(member))
    if (members.some((member) => !member)) {
      return resolved
    }
    const valueMembers = members.filter(
      (member) => member && Object.keys(member).some((key) => !annotationKeys.has(key)),
    )
    const valueMember = valueMembers[0]
    if (valueMembers.length !== 1 || !valueMember) {
      return resolved
    }
    const valueIndex = members.indexOf(valueMember)
    const valueSchema = visit(resolved.allOf[valueIndex])
    const annotations = Object.assign({}, ...members.filter((member) => member !== valueMember))
    const { allOf: _allOf, ...siblings } = resolved
    const result = { ...valueSchema, ...annotations, ...siblings }
    Reflect.deleteProperty(result, '__scalar_')
    return result
  }
  return visit(schema)
}
