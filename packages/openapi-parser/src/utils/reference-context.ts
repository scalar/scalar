/** Distinguishes reference-bearing objects from name maps and opaque instance data. */
export type ReferenceContext =
  | 'link'
  | 'linkMap'
  | 'discriminator'
  | 'object'
  | 'schema'
  | 'response'
  | 'responseMap'
  | 'example'
  | 'objectMap'
  | 'schemaMap'
  | 'exampleMap'
  | 'callbackMap'
  | 'callback'
  | 'literal'

const schemaMaps = new Set(['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'])
const schemaArrays = new Set(['allOf', 'anyOf', 'oneOf', 'prefixItems'])
const schemaValues = new Set([
  'schema',
  'items',
  'additionalItems',
  'contains',
  'additionalProperties',
  'unevaluatedProperties',
  'unevaluatedItems',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
  'contentSchema',
])
const objectMaps = new Set([
  'paths',
  'additionalOperations',
  'webhooks',
  'content',
  'mediaTypes',
  'headers',
  'encoding',
  'variables',
  'parameters',
  'requestBodies',
  'securitySchemes',
  'pathItems',
])
const literalValues = new Set(['example', 'default', 'enum', 'const'])

/** A map's names are data, even when a name happens to be an OpenAPI keyword. */
export const getChildReferenceContext = (context: ReferenceContext, key: string, value: unknown): ReferenceContext => {
  if (context === 'literal') {
    return 'literal'
  }
  if (context === 'callbackMap') {
    return 'callback'
  }
  if (context === 'callback') {
    return 'object'
  }
  if (context === 'responseMap') {
    return 'response'
  }
  if (context === 'schemaMap') {
    return 'schema'
  }
  if (context === 'objectMap') {
    return 'object'
  }
  if (context === 'linkMap') {
    return 'link'
  }
  if (context === 'exampleMap') {
    return 'example'
  }
  if (
    key.startsWith('x-') ||
    key === 'scopes' ||
    (context === 'discriminator' && key === 'mapping') ||
    (context === 'link' && (key === 'requestBody' || key === 'parameters'))
  ) {
    return 'literal'
  }
  if (key === 'links') {
    return 'linkMap'
  }
  if (key === 'discriminator') {
    return 'discriminator'
  }
  if (literalValues.has(key) || (context === 'example' && (key === 'value' || key === 'dataValue'))) {
    return 'literal'
  }
  if (key === 'examples') {
    // OpenAPI 2 response examples map media types directly to instance data.
    return context === 'schema' || context === 'response' || Array.isArray(value) ? 'literal' : 'exampleMap'
  }
  if (schemaMaps.has(key) || schemaArrays.has(key) || key === 'schemas') {
    return 'schemaMap'
  }
  if (schemaValues.has(key)) {
    return Array.isArray(value) ? 'schemaMap' : 'schema'
  }
  if (key === 'responses') {
    return 'responseMap'
  }
  if (key === 'callbacks') {
    return 'callbackMap'
  }
  if (objectMaps.has(key)) {
    return 'objectMap'
  }
  return 'object'
}

/** Only objects in reference positions may interpret their own $ref field as a URI. */
export const canResolveReference = (context: ReferenceContext): boolean =>
  context === 'link' ||
  context === 'object' ||
  context === 'schema' ||
  context === 'example' ||
  context === 'callback' ||
  context === 'response'
