import type { OpenAPIV3_1 } from '@scalar/openapi-types'

export type CompositionMapping = {
  [key: string]: string
}

/** Composition */
export type CompositionKeyword = 'oneOf' | 'anyOf' | 'allOf' | 'not'

export const compositions: CompositionKeyword[] = ['oneOf', 'anyOf', 'allOf', 'not']

/** Get composition mapping from schema - used in testing */
export function getCompositionSchemaMapping(
  schema: OpenAPIV3_1.SchemaObject,
  composition: CompositionKeyword,
): CompositionMapping | undefined {
  if (!schema[composition] || !Array.isArray(schema[composition])) {
    return undefined
  }

  const schemas = schema[composition] as OpenAPIV3_1.SchemaObject[]
  const mapping: CompositionMapping = {}

  for (const s of schemas) {
    if (s.title) {
      mapping[s.title] = s.title
    } else if (s.type === 'object' && s.properties) {
      const typeProp = s.properties.type
      if (typeProp && 'enum' in typeProp && Array.isArray(typeProp.enum)) {
        const typeValue = typeProp.enum[0]
        if (typeof typeValue === 'string') {
          mapping[typeValue] = s.title || typeValue
        }
      }
    }
  }

  return Object.keys(mapping).length > 0 ? mapping : undefined
}

/** Check if schema has a composition keyword */
export function hasComposition(schema: OpenAPIV3_1.SchemaObject): boolean {
  return compositions.some((composition) => schema[composition] !== undefined)
}
