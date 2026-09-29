import type {
  ExampleObject,
  MediaTypeObject,
  ParameterObject,
  RequestBodyObject,
  SchemaObject,
  SchemaReferenceType,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { resolve } from '@/resolve'

/** Helper to get example from examples object with fallback to example field */
const getExampleFromExamples = (
  examples: MediaTypeObject['examples'],
  exampleField: MediaTypeObject['example'],
  exampleName: string | undefined,
): ExampleObject | undefined => {
  if (!examples && exampleField === undefined) {
    return undefined
  }

  const hasExamples = !!examples && Object.keys(examples).length > 0

  // Grab the example key
  const key = exampleName || Object.keys(examples ?? {})[0] || ''
  const example = getResolvedRef(examples?.[key])
  if (example !== undefined) {
    return example
  }

  // Fallback to example field when no examples map exists,
  // or when no specific example key was requested.
  if ((!hasExamples || !exampleName) && exampleField !== undefined) {
    return { value: getResolvedRef(exampleField) }
  }

  return undefined
}

/**
 * Keep parameter fallback precedence while collecting only values declared by the schema.
 * The general schema generator also invents values for properties without examples, which would
 * unexpectedly populate and enable optional request parameters.
 */
const getSchemaExample = (
  input: SchemaReferenceType<SchemaObject>,
  ancestors: Set<unknown> = new Set(),
): ExampleObject | undefined => {
  const schema = resolve.schema(input)

  if ('default' in schema && schema.default !== undefined) {
    return { value: schema.default }
  }
  if ('enum' in schema && schema.enum?.[0] !== undefined) {
    return { value: schema.enum[0] }
  }
  if ('examples' in schema && schema.examples?.[0] !== undefined) {
    return { value: schema.examples[0] }
  }
  if ('example' in schema && schema.example !== undefined) {
    return { value: schema.example }
  }

  // Reference siblings create a fresh merged object, so track the underlying schema for cycles.
  const target = getResolvedRef(input) ?? input
  if (!('properties' in schema) || !schema.properties || ancestors.has(target)) {
    return undefined
  }

  ancestors.add(target)
  const properties = Object.entries(schema.properties).flatMap(([name, property]) => {
    const example = getSchemaExample(property, ancestors)
    return example === undefined ? [] : [[name, example.value]]
  })
  ancestors.delete(target)

  return properties.length > 0 ? { value: Object.fromEntries(properties) } : undefined
}

/**
 * Resolve an example value for a parameter or requestBody from either `examples` or `content.*.examples`.
 * Or the [deprecated] `example` field.
 * If no exampleKey is provided it will fallback to the first example in the examples object then the [deprecated]
 * `example` field.
 * When the parameter carries both its own `examples`/`example` and a `content` object, the parameter-level value
 * takes priority to preserve edits saved by older clients before they are migrated into the media type.
 * Used both for send-request and generating code snippets.
 */
export const getExample = (
  param: ParameterObject | RequestBodyObject | MediaTypeObject,
  exampleName: string | undefined,
  contentType: string | undefined,
): ExampleObject | undefined => {
  // Schema-based parameters and content-based parameter edits saved by older clients.
  if ('examples' in param || 'example' in param) {
    const result = getExampleFromExamples(param.examples, param.example, exampleName)
    if (result !== undefined) {
      return result
    }
  }

  // Content based parameters
  if ('content' in param) {
    const content = param.content?.[contentType ?? Object.keys(param.content)[0] ?? '']
    const result = getExampleFromExamples(content?.examples, content?.example, exampleName)
    if (result !== undefined) {
      return result
    }
  }

  // Derive value from the schema
  const resolvedParam = getResolvedRef(param)
  if (resolvedParam && 'schema' in resolvedParam && resolvedParam.schema) {
    return getSchemaExample(resolvedParam.schema)
  }

  return undefined
}
