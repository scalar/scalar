import { isDefined } from '@scalar/helpers/array/is-defined'
import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject, SchemaReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

import { type CompositionKeyword, compositions } from './schema-composition'
import { shouldRenderArrayItemComposition } from './should-render-array-item-composition'

type CompositionToRender = {
  composition: CompositionKeyword
  value: SchemaObject
}

const inferOneOfFromDiscriminatorMapping = (value: SchemaObject): SchemaObject['oneOf'] => {
  // If composition is already explicit, do not synthesize a second composition selector.
  if (value.oneOf || value.anyOf || value.allOf || value.not) {
    return undefined
  }

  const mapping = value.discriminator?.mapping
  if (!mapping) {
    return undefined
  }

  const inferredOneOf = Object.values(mapping)
    .filter((mappingValue) => Boolean(mappingValue))
    .map(
      (mappingValue): SchemaReferenceType<SchemaObject> => ({
        $ref: mappingValue,
        '$ref-value': { $ref: mappingValue },
      }),
    )

  return inferredOneOf.length > 0 ? inferredOneOf : undefined
}

/**
 * Computes which compositions should be rendered and with which values
 *
 * @param value - The schema object to check for compositions
 * @returns Array of compositions to render with their values
 */
export const getCompositionsToRender = (value: SchemaObject | undefined): CompositionToRender[] => {
  if (!value) {
    return []
  }

  const inferredOneOf = inferOneOfFromDiscriminatorMapping(value)
  const resolvedSchema = inferredOneOf ? resolve.schema({ ...value, oneOf: inferredOneOf }) : resolve.schema(value)

  return compositions
    .map((composition) => {
      // Check for array item-level composition first (more specific case)
      if (shouldRenderArrayItemComposition(value, composition) && isArraySchema(value) && value.items) {
        return {
          composition,
          value: resolve.schema(value.items),
        }
      }

      // Check for property-level composition
      const hasPropertyLevelComposition =
        composition === 'oneOf' ? Boolean(value.oneOf || inferredOneOf) : Boolean(value[composition])

      if (hasPropertyLevelComposition) {
        // Skip if array items have this composition (even if complex/not rendered)
        const hasArrayItemComposition =
          isArraySchema(value) && value.items && typeof value.items === 'object' && composition in value.items

        if (!hasArrayItemComposition) {
          return {
            composition,
            value: resolvedSchema,
          }
        }
      }

      return null
    })
    .filter(isDefined)
}
