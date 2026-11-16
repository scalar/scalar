/** Schema-valued fields defined by the AsyncAPI protocol binding specifications. */
const bindingSchemaProperties: Record<string, readonly string[]> = {
  'binding:http': ['query', 'headers'],
  'binding:ws': ['query', 'headers'],
  'binding:anypointmq': ['headers'],
  'binding:jms': ['headers'],
  'binding:kafka': ['groupId', 'clientId', 'key'],
  'binding:mqtt': [
    'sessionExpiryInterval',
    'maximumPacketSize',
    'messageExpiryInterval',
    'correlationData',
    'responseTopic',
  ],
  'binding:mqtt5': ['sessionExpiryInterval'],
  'binding:solace': ['timeToLive', 'priority'],
}

/** Schema positions retain the vocabulary inherited by their subschemas and references. */
type SchemaContext =
  | 'schema'
  | 'asyncapi-schema'
  | 'asyncapi-schema-object'
  | 'draft-04-schema'
  | 'draft-06-schema'
  | 'draft-07-schema'
  | 'openapi-3.0-schema'

/** Distinguish reference-bearing document structures from literal instance data without validating the document. */
export type ReferenceContext =
  | SchemaContext
  | 'generic'
  | 'object'
  | 'components'
  | 'paths'
  | 'named-responses'
  | 'objects'
  | 'schemas'
  | 'asyncapi-schemas'
  | 'asyncapi-schema-objects'
  | 'draft-04-schemas'
  | 'draft-06-schemas'
  | 'draft-07-schemas'
  | 'openapi-3.0-schemas'
  | 'data'
  | 'data-container'
  | 'response'
  | 'responses'
  | 'link'
  | 'links'
  | 'path-item'
  | 'path-items'
  | 'callback'
  | 'callbacks'
  | 'message'
  | 'messages'
  | 'bindings'
  | 'binding-sets'
  | `binding:${string}`

const schemaMapContexts: Record<SchemaContext, ReferenceContext> = {
  schema: 'schemas',
  'asyncapi-schema': 'asyncapi-schemas',
  'asyncapi-schema-object': 'asyncapi-schema-objects',
  'draft-04-schema': 'draft-04-schemas',
  'draft-06-schema': 'draft-06-schemas',
  'draft-07-schema': 'draft-07-schemas',
  'openapi-3.0-schema': 'openapi-3.0-schemas',
}

/** Determine the interpretation of a child without treating data keywords as references. */
export const childReferenceContext = (
  context: ReferenceContext,
  key: string,
  { swagger, asyncapi, schemaFormat }: { swagger: boolean; asyncapi: boolean; schemaFormat?: string },
): ReferenceContext => {
  if (context === 'generic') return 'generic'
  if (context === 'data-container') return 'data'
  if (context === 'binding-sets') return 'bindings'
  if (context === 'bindings') return key.startsWith('x-') ? 'data' : `binding:${key}`
  if (context.startsWith('binding:') && bindingSchemaProperties[context]?.includes(key)) return 'asyncapi-schema-object'
  if (context === 'messages') return 'message'
  if (context === 'message' && key === 'traits') return 'messages'
  if (context === 'message' && key === 'oneOf') return 'messages'
  if (['object', 'components'].includes(context) && key === 'messageTraits') return 'messages'
  if (context === 'message' && key === 'examples') return 'data'
  if (context === 'message' && ['payload', 'headers'].includes(key)) return asyncapi ? 'asyncapi-schema' : 'schema'
  if (key === 'message' && context === 'object') return 'message'
  if (key === 'messages' && ['object', 'components'].includes(context)) return 'messages'
  if (context === 'data') return 'data'
  if (context === 'paths') return key.startsWith('x-') ? 'data' : 'path-item'
  if (context === 'named-responses') return 'response'
  if (context === 'path-items') return 'path-item'
  if (context === 'callbacks') return 'callback'
  if (context === 'callback') return key.startsWith('x-') ? 'data' : 'path-item'
  if (context === 'schemas') return 'schema'
  if (context === 'asyncapi-schemas') return 'asyncapi-schema'
  if (context === 'asyncapi-schema-objects') return 'asyncapi-schema-object'
  if (context === 'draft-04-schemas') return 'draft-04-schema'
  if (context === 'draft-06-schemas') return 'draft-06-schema'
  if (context === 'draft-07-schemas') return 'draft-07-schema'
  if (context === 'openapi-3.0-schemas') return 'openapi-3.0-schema'
  if (context === 'objects') return 'object'
  if (context === 'responses') return key.startsWith('x-') ? 'data' : 'response'
  if (context === 'links') return 'link'
  if (isSchemaContext(context)) {
    // Wrapper formats select a schema vocabulary; subschemas cannot introduce another wrapper.
    if (context === 'asyncapi-schema' && schemaFormat !== undefined && key === 'schema') {
      if (/^application\/vnd\.aai\.asyncapi(?:\+json|\+yaml)?;version=3\.[01]\.\d+$/.test(schemaFormat))
        return 'asyncapi-schema-object'
      const draft = /^application\/schema\+(?:json|yaml);version=draft-(04|06|07)$/.exec(schemaFormat)?.[1]
      if (draft === '04' || draft === '06' || draft === '07') return `draft-${draft}-schema`
      if (/^application\/vnd\.oai\.openapi(?:\+json|\+yaml)?;version=3\.0\.\d+$/.test(schemaFormat))
        return 'openapi-3.0-schema'
      return 'schema'
    }
    const nativeSchema =
      context === 'asyncapi-schema-object' || (context === 'asyncapi-schema' && schemaFormat === undefined)
    const legacyJsonSchema = ['draft-04-schema', 'draft-06-schema', 'draft-07-schema'].includes(context)
    const modernSchema = context === 'schema'
    const schemaContext = nativeSchema
      ? 'asyncapi-schema-object'
      : legacyJsonSchema || context === 'openapi-3.0-schema'
        ? context
        : 'schema'
    if (nativeSchema && key === 'externalDocs') return 'object'
    if ((nativeSchema || legacyJsonSchema) && key === 'additionalItems') return schemaContext
    if (
      key === 'properties' ||
      (context !== 'openapi-3.0-schema' && ['patternProperties', 'dependencies', 'definitions'].includes(key)) ||
      (modernSchema && ['dependentSchemas', '$defs'].includes(key))
    )
      return schemaMapContexts[schemaContext]
    if (
      ['items', 'additionalProperties', 'not', 'allOf', 'anyOf', 'oneOf'].includes(key) ||
      ((modernSchema || nativeSchema || context === 'draft-06-schema' || context === 'draft-07-schema') &&
        ['contains', 'propertyNames'].includes(key)) ||
      ((modernSchema || nativeSchema || context === 'draft-07-schema') && ['if', 'then', 'else'].includes(key)) ||
      (modernSchema && ['unevaluatedProperties', 'unevaluatedItems', 'contentSchema', 'prefixItems'].includes(key))
    )
      return schemaContext
    return 'data'
  }
  if (context === 'link' && ['parameters', 'requestBody'].includes(key)) return 'data'
  if (context === 'response' && swagger && key === 'examples') return 'data'
  if (key === 'components') return 'components'
  if (key === 'paths') return 'paths'
  if (['webhooks', 'pathItems'].includes(key)) return 'path-items'
  if (key === 'callbacks') return 'callbacks'
  if (key === 'responses') return context === 'components' ? 'named-responses' : 'responses'
  if (key === 'links') return 'links'
  if (key.startsWith('x-')) return 'data'
  if (asyncapi && key === 'bindings') return 'bindings'
  if (
    asyncapi &&
    context === 'components' &&
    ['serverBindings', 'channelBindings', 'operationBindings', 'messageBindings'].includes(key)
  )
    return 'binding-sets'
  if (['example', 'default', 'enum', 'const', 'value', 'dataValue', 'serializedValue'].includes(key)) return 'data'
  if (key === 'examples') return 'objects'
  if (asyncapi && context === 'components' && key === 'schemas') return 'asyncapi-schemas'
  if (asyncapi && ['servers', 'variables'].includes(key)) return 'objects'
  if (
    asyncapi &&
    context === 'components' &&
    [
      'serverVariables',
      'correlationIds',
      'replies',
      'replyAddresses',
      'externalDocs',
      'tags',
      'operationTraits',
    ].includes(key)
  )
    return 'objects'
  if (['schemas', 'definitions', '$defs'].includes(key)) return 'schemas'
  if (key === 'schema') return asyncapi ? 'asyncapi-schema-object' : 'schema'
  if (key === 'itemSchema') return 'schema'
  if (
    [
      'content',
      'parameters',
      'headers',
      'requestBodies',
      'securitySchemes',
      'channels',
      'messages',
      'operations',
    ].includes(key)
  )
    return 'objects'
  return 'object'
}

/** Whether the node itself can contain a reference, rather than named entries. */
export const isReferenceContext = (context: ReferenceContext): boolean =>
  isSchemaContext(context) ||
  context.startsWith('binding:') ||
  ['generic', 'object', 'response', 'link', 'path-item', 'callback', 'message', 'bindings'].includes(context)

/** Schema vocabularies and AsyncAPI wrapper positions may identify or reference schemas. */
export const isSchemaContext = (context: ReferenceContext | undefined): context is SchemaContext =>
  context !== undefined && Object.hasOwn(schemaMapContexts, context)
