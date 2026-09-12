import { isDefined } from '@scalar/helpers/array/is-defined'
import { resolve } from '@scalar/workspace-store/resolve'
import type { OpenApiDocument, SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.2/strict/type-guards'

import { getRefName } from './get-ref-name'
import { type CompositionKeyword, compositions } from './schema-composition'
import { shouldRenderArrayItemComposition } from './should-render-array-item-composition'
import { unwrapForRead } from './unwrap-for-read'

type CompositionToRender = {
  composition: CompositionKeyword
  value: SchemaObject
}

type DocumentSchemaLookup = Pick<OpenApiDocument, 'components'>

const normalizeDiscriminatorMappingRef = (value: string) =>
  value.startsWith('#/') || value.includes('/') ? value : `#/components/schemas/${value}`

/**
 * Builds a synthetic `oneOf` composition from a `discriminator.mapping` when the
 * schema declares a mapping but no explicit `oneOf`/`anyOf`. This is the shape
 * NSwag emits for polymorphic types, where the base type is a plain object with
 * a discriminator mapping pointing at the concrete variants.
 *
 * Returns `null` when there is nothing to infer (an explicit composition is
 * already present, no document to resolve refs against, or no resolvable refs).
 */
export const inferDiscriminatorMappingComposition = (
  value: SchemaObject,
  documentProp?: DocumentSchemaLookup,
): SchemaObject | null => {
  if (value.oneOf || value.anyOf) {
    return null
  }

  // A schema without a mapping can never infer anything, so it is checked before the document is
  // touched at all: the document read below is by far the more expensive of the two.
  const mapping = value.discriminator?.mapping

  if (!mapping) {
    return null
  }

  // Reading `components.schemas` per row through the reactive and detect-changes layers is the
  // dominant cost of this helper, so the document is unwrapped once here. See `unwrapForRead`.
  const document = unwrapForRead(documentProp)

  if (!document?.components?.schemas) {
    return null
  }

  const refs = Object.values(mapping)
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
    oneOf: refs,
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
  /**
   * The `oneOf` inferred from a bare `discriminator.mapping`, when the caller has
   * already computed it. `SchemaProperty` needs the same value to decide whether
   * to suppress the duplicate base object block, so it passes it here to avoid
   * inferring twice. Omit it and it is inferred from `value`.
   */
  inferredDiscriminatorComposition: SchemaObject | null = value
    ? inferDiscriminatorMappingComposition(value, document)
    : null,
): CompositionToRender[] => {
  if (!value) {
    return []
  }

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
