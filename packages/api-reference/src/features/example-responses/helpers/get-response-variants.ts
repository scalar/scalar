import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { resolve } from '@scalar/workspace-store/resolve'
import type { MediaTypeObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { getSchemaType } from '@/components/Content/Schema/helpers/get-schema-type'
import { getModelNameWithArray } from '@/components/Content/Schema/helpers/schema-name'

/** A root response union and the labels used to select its generated examples. */
type ResponseVariants = {
  composition: 'oneOf' | 'anyOf'
  examples: NonNullable<MediaTypeObject['examples']>
  defaultKey: string
}

/** Keep explicit schema samples ahead of generated union variants. */
export const getResponseVariants = (response: MediaTypeObject | undefined): ResponseVariants | undefined => {
  const schema = resolve.schema(response?.schema)
  if (
    !schema ||
    schema.examples?.[0] !== undefined ||
    schema.example !== undefined ||
    schema.default !== undefined ||
    schema.const !== undefined ||
    // An empty enum permits no value, so union branches cannot offer valid alternatives.
    schema.enum !== undefined
  ) {
    return undefined
  }

  const composition = schema.oneOf ? 'oneOf' : 'anyOf'
  const variants = schema[composition]
  if (!variants || variants.length < 2) {
    return undefined
  }

  const options = variants.flatMap((variant, index) => {
    if (getResolvedRef(variant) === undefined) {
      return []
    }
    const resolved = resolve.schema(variant)
    if (!resolved) {
      return []
    }
    const name = getModelNameWithArray(resolved)?.label
    return [{ key: String(index), summary: name || `${getSchemaType(resolved)} ${index + 1}`, schema: resolved }]
  })
  if (options.length < 2) {
    return undefined
  }

  return {
    composition,
    examples: Object.fromEntries(options.map(({ key, summary }) => [key, { summary }])),
    defaultKey: (options.find(({ schema }) => !('type' in schema) || schema.type !== 'null') ?? options[0])!.key,
  }
}
