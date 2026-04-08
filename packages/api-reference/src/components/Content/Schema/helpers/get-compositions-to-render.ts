import { isDefined } from '@scalar/helpers/array/is-defined'
import { resolve } from '@scalar/workspace-store/resolve'
import type { OpenApiDocument, SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

import { getRefName } from './get-ref-name'
import { type CompositionKeyword, compositions } from './schema-composition'
import { shouldRenderArrayItemComposition } from './should-render-array-item-composition'

type CompositionToRender = {
  composition: CompositionKeyword
  value: SchemaObject
}

type DocumentSchemaLookup = Pick<OpenApiDocument, 'components'>

const normalizeDiscriminatorMappingRef = (value: string) =>
  value.startsWith('#/') || value.includes('/') ? value : `#/components/schemas/${value}`

const inferDiscriminatorMappingComposition = (
  value: SchemaObject,
  document?: DocumentSchemaLookup,
): SchemaObject | null => {
  if (value.oneOf || value.anyOf || !document?.components?.schemas) {
    return null
  }

  const refs = Object.values(value.discriminator?.mapping ?? {})
    .filter((mappingValue): mappingValue is string => typeof mappingValue === 'string')
    .map((mappingValue) => {
      const ref = normalizeDiscriminatorMappingRef(mappingValue)
      const refName = getRefName(ref)
      const refValue = refName ? resolve.schema(document.components?.schemas?.[refName]) : undefined

      if (!refValue) {
        return undefined
      }

      return {
        $ref: ref,
        '$ref-value': refValue,
      }
    })
    .filter(isDefined)

  if (refs.length === 0) {
    return null
  }

  return {
    ...resolve.schema(value),
    oneOf: refs as NonNullable<SchemaObject['oneOf']>,
  }
}

/**
 * Computes which compositions should be rendered and with which values
 *
 * @param value - The schema object to check for compositions
 * @returns Array of compositions to render with their values
 */
export const getCompositionsToRender = (
  value: SchemaObject | undefined,
  document?: DocumentSchemaLookup,
): CompositionToRender[] => {
  if (!value) {
    return []
  }

  const inferredDiscriminatorComposition = inferDiscriminatorMappingComposition(value, document)

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
