/** Distinguish reference-bearing document structures from literal instance data without validating the document. */
export type ReferenceContext =
  | 'generic'
  | 'object'
  | 'components'
  | 'paths'
  | 'named-responses'
  | 'schema'
  | 'objects'
  | 'schemas'
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

/** Determine the interpretation of a child without treating data keywords as references. */
export const childReferenceContext = (context: ReferenceContext, key: string, swagger: boolean): ReferenceContext => {
  if (context === 'generic') return 'generic'
  if (context === 'data-container') return 'data'
  if (context === 'messages') return 'message'
  if (context === 'message' && key === 'traits') return 'messages'
  if (context === 'message' && key === 'oneOf') return 'messages'
  if (['object', 'components'].includes(context) && key === 'messageTraits') return 'messages'
  if (context === 'message' && key === 'examples') return 'data'
  if (context === 'message' && ['payload', 'headers'].includes(key)) return 'schema'
  if (key === 'message' && context === 'object') return 'message'
  if (key === 'messages' && ['object', 'components'].includes(context)) return 'messages'
  if (context === 'data') return 'data'
  if (context === 'paths') return key.startsWith('x-') ? 'data' : 'path-item'
  if (context === 'named-responses') return 'response'
  if (context === 'path-items') return 'path-item'
  if (context === 'callbacks') return 'callback'
  if (context === 'callback') return key.startsWith('x-') ? 'data' : 'path-item'
  if (context === 'schemas') return 'schema'
  if (context === 'objects') return 'object'
  if (context === 'responses') return key.startsWith('x-') ? 'data' : 'response'
  if (context === 'links') return 'link'
  if (context === 'schema') {
    if (['properties', 'patternProperties', 'dependentSchemas', 'dependencies', '$defs', 'definitions'].includes(key))
      return 'schemas'
    if (
      [
        'items',
        'additionalProperties',
        'unevaluatedProperties',
        'unevaluatedItems',
        'contains',
        'contentSchema',
        'propertyNames',
        'not',
        'if',
        'then',
        'else',
        'allOf',
        'anyOf',
        'oneOf',
        'prefixItems',
      ].includes(key)
    )
      return 'schema'
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
  if (['example', 'default', 'enum', 'const', 'value', 'dataValue', 'serializedValue'].includes(key)) return 'data'
  if (key === 'examples') return 'objects'
  if (['schemas', 'definitions', '$defs'].includes(key)) return 'schemas'
  if (key === 'schema') return 'schema'
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
  ['generic', 'object', 'schema', 'response', 'link', 'path-item', 'callback', 'message'].includes(context)
