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

// Keep suggestion provenance out of API descriptions and persisted user examples.
const generatedExamples = new WeakSet<ExampleObject>()

/** Whether an example contains only enum suggestions rather than authored values. */
export const isGeneratedExample = (example: ExampleObject | undefined): boolean =>
  example !== undefined && generatedExamples.has(example)

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

/** A schema whose walk found no declared value. */
type WalkWithoutValue = {
  /** The `properties` it was walked with. Reference siblings can replace them. */
  properties: unknown
  /** Schemas above it that its walk stopped at. The result holds while all of them are still ancestors. */
  stops: unknown[]
}

/** State shared by one walk of `getSchemaExample`. */
type SchemaExampleWalk = {
  /** Schemas on the current path. */
  ancestors: Set<unknown>
  /** Schemas found to declare no value, so later paths can skip them. */
  withoutValues: Map<unknown, WalkWithoutValue>
  /** Ancestors the walk of the current schema has stopped at so far. */
  stops: Set<unknown>
}

/**
 * Keep parameter fallback precedence while collecting only values declared by the schema.
 * The general schema generator also invents values for properties without examples, which would
 * unexpectedly populate and enable optional request parameters.
 *
 * The walk has no depth cap, so a schema reached along many paths is remembered once it is known to
 * declare nothing; otherwise a deep graph of shared schemas costs one visit per path. Another path
 * walks the same schemas, except that it stops at its own ancestors, and a stop can only drop values.
 * So while every ancestor the first walk stopped at is still an ancestor, the walk finds nothing again.
 */
const getSchemaExample = (
  input: SchemaReferenceType<SchemaObject>,
  walk: SchemaExampleWalk = { ancestors: new Set(), withoutValues: new Map(), stops: new Set() },
): ExampleObject | undefined => {
  const schema = resolve.schema(input)

  if ('default' in schema && schema.default !== undefined) {
    return { value: schema.default }
  }
  if ('examples' in schema && schema.examples?.[0] !== undefined) {
    return { value: schema.examples[0] }
  }
  if ('example' in schema && schema.example !== undefined) {
    return { value: schema.example }
  }
  if ('enum' in schema && schema.enum?.[0] !== undefined) {
    const example = { value: schema.enum[0] }
    generatedExamples.add(example)
    return example
  }

  // Reference siblings create a fresh merged object, so track the underlying schema for cycles.
  const target = getResolvedRef(input) ?? input
  if (!('properties' in schema) || !schema.properties) {
    return undefined
  }

  if (walk.ancestors.has(target)) {
    walk.stops.add(target)
    return undefined
  }
  const known = walk.withoutValues.get(target)
  if (known?.properties === schema.properties && known.stops.every((stop) => walk.ancestors.has(stop))) {
    known.stops.forEach((stop) => walk.stops.add(stop))
    return undefined
  }

  const outerStops = walk.stops
  walk.stops = new Set()
  walk.ancestors.add(target)
  const properties = Object.entries(schema.properties).flatMap(([name, property]) => {
    const example = getSchemaExample(property, walk)
    return example === undefined ? [] : [{ name, example }]
  })
  walk.ancestors.delete(target)
  // Stops at schemas inside this walk have left the path, so the rest point above it.
  const stops = [...walk.stops].filter((stop) => walk.ancestors.has(stop))
  walk.stops = outerStops
  stops.forEach((stop) => outerStops.add(stop))

  if (properties.length > 0) {
    const example = { value: Object.fromEntries(properties.map(({ name, example }) => [name, example.value])) }
    if (properties.every(({ example }) => isGeneratedExample(example))) {
      generatedExamples.add(example)
    }
    return example
  }
  walk.withoutValues.set(target, { properties: schema.properties, stops })
  return undefined
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
