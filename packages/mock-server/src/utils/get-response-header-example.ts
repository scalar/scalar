import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'

import type { ExampleGenerationContext } from './generate-response-example'

type ExampleSource = {
  example?: unknown
  examples?: Record<string, unknown>
  schema?: unknown
}

/** The value of the first entry in an `examples` map, resolving `$ref` Example Objects. */
const getFirstExampleValue = (examples: ExampleSource['examples']): unknown => {
  for (const example of Object.values(examples ?? {})) {
    const resolved = getResolvedRef(example) as { value?: unknown } | undefined
    if (resolved?.value !== undefined) {
      return resolved.value
    }
  }
  return undefined
}

/** Prefer an authored `example`, then the first `examples` entry, then a value generated from `schema`. */
const getExample = (source: ExampleSource, generationContext: ExampleGenerationContext): unknown => {
  if (source.example !== undefined) {
    return source.example
  }
  const fromExamples = getFirstExampleValue(source.examples)
  if (fromExamples !== undefined) {
    return fromExamples
  }
  return source.schema
    ? // Headers use the generator defaults to preserve their declared values.
      getExampleFromSchema(getResolvedRefDeep(source.schema as object) as never, generationContext)
    : undefined
}

/**
 * Pick the value to send for a declared response header.
 *
 * A Header Object describes its value either with a `schema` or with a `content` map holding a single
 * media type. Either way an authored `example` or `examples` entry wins over a generated value, as it
 * does for bodies, so `X-Rate-Limit: { schema: { type: integer }, example: 100 }` sends `100` instead of
 * a generated `1`.
 */
export const getResponseHeaderExample = (
  header: unknown,
  generationContext: ExampleGenerationContext = {},
): unknown => {
  const headerObject = getResolvedRef(header) as (ExampleSource & { content?: Record<string, unknown> }) | undefined
  if (!headerObject || typeof headerObject !== 'object') {
    return undefined
  }

  if (headerObject.schema || headerObject.example !== undefined || headerObject.examples) {
    return getExample(headerObject, generationContext)
  }

  const [media] = Object.values(headerObject.content ?? {})
  const mediaObject = getResolvedRef(media) as ExampleSource | undefined
  return mediaObject ? getExample(mediaObject, generationContext) : undefined
}
