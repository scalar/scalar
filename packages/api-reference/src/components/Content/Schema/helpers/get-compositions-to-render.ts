import { isDefined } from '@scalar/helpers/array/is-defined'
import { resolve } from '@scalar/workspace-store/resolve'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

import { type CompositionKeyword, compositions } from './schema-composition'
import { shouldRenderArrayItemComposition } from './should-render-array-item-composition'

type CompositionToRender = {
  composition: CompositionKeyword
  value: SchemaObject
}

const normalizeDiscriminatorMappingRef = (value: string) =>
  value.startsWith('#/') || value.includes('/') ? value : `#/components/schemas/${value}`

const inferDiscriminatorMappingComposition = (value: SchemaObject): SchemaObject | null => {
  if (value.oneOf || value.anyOf) {
    return null
  }

  const mappingValues = Object.values(value.discriminator?.mapping ?? {})

  if (mappingValues.length === 0) {
    return null
  }

  return {
    ...resolve.schema(value),
    oneOf: mappingValues.map((mappingValue) => ({
      $ref: normalizeDiscriminatorMappingRef(mappingValue),
    })),
  }
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

  const inferredDiscriminatorComposition = inferDiscriminatorMappingComposition(value)

  return compositions
    .map((composition) => {
      if (composition === 'oneOf' && inferredDiscriminatorComposition) {
        return {
          composition,
          value: inferredDiscriminatorComposition,
        }
      }

      // Check for array item-level composition first (more specific case)
      if (shouldRenderArrayItemComposition(value, composition) && isArraySchema(value) && value.items) {
        return {
          composition,
          value: resolve.schema(value.items),
        }
      }

      // Check for property-level composition
      if (value[composition]) {
        // Skip if array items have this composition (even if complex/not rendered)
        const hasArrayItemComposition =
          isArraySchema(value) && value.items && typeof value.items === 'object' && composition in value.items

        if (!hasArrayItemComposition) {
          return {
            composition,
            value: resolve.schema(value),
          }
        }
      }

      return null
    })
    .filter(isDefined)
}
