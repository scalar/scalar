import { isObject } from '@scalar/helpers/object/is-object'

type ObjectKind =
  | 'document'
  | 'components'
  | 'pathItem'
  | 'operation'
  | 'parameter'
  | 'body'
  | 'media'
  | 'encoding'
  | 'schema'
type Child = readonly [key: string, kind: ObjectKind, collection?: boolean]

/** Only these fields contain schemas or OpenAPI objects that can lead to schemas. */
const children: Record<ObjectKind, readonly Child[]> = {
  document: [
    ['components', 'components'],
    ['paths', 'pathItem', true],
    ['webhooks', 'pathItem', true],
  ],
  components: [
    ['schemas', 'schema', true],
    ['parameters', 'parameter', true],
    ['headers', 'parameter', true],
    ['requestBodies', 'body', true],
    ['responses', 'body', true],
    ['pathItems', 'pathItem', true],
  ],
  pathItem: [
    ['parameters', 'parameter', true],
    ['get', 'operation'],
    ['put', 'operation'],
    ['post', 'operation'],
    ['delete', 'operation'],
    ['options', 'operation'],
    ['head', 'operation'],
    ['patch', 'operation'],
    ['trace', 'operation'],
  ],
  operation: [
    ['parameters', 'parameter', true],
    ['requestBody', 'body'],
    ['responses', 'body', true],
  ],
  parameter: [
    ['schema', 'schema'],
    ['content', 'media', true],
  ],
  body: [
    ['content', 'media', true],
    ['headers', 'parameter', true],
  ],
  media: [
    ['schema', 'schema'],
    ['encoding', 'encoding', true],
  ],
  encoding: [['headers', 'parameter', true]],
  schema: [
    ['properties', 'schema', true],
    ['patternProperties', 'schema', true],
    ['$defs', 'schema', true],
    ['definitions', 'schema', true],
    ['dependentSchemas', 'schema', true],
    ['allOf', 'schema', true],
    ['anyOf', 'schema', true],
    ['oneOf', 'schema', true],
    ['prefixItems', 'schema', true],
    ['items', 'schema'],
    ['contains', 'schema'],
    ['additionalProperties', 'schema'],
    ['unevaluatedProperties', 'schema'],
    ['unevaluatedItems', 'schema'],
    ['propertyNames', 'schema'],
    ['not', 'schema'],
    ['if', 'schema'],
    ['then', 'schema'],
    ['else', 'schema'],
    ['contentSchema', 'schema'],
  ],
}

/** Migrate XML metadata without interpreting examples or other payload data as schemas. */
export const migrateXmlObjects = (value: unknown, kind: ObjectKind = 'document'): void => {
  if (!isObject(value)) {
    return
  }

  if (kind === 'schema' && isObject(value.xml)) {
    if (value.xml.wrapped === true && value.xml.attribute === true) {
      throw new Error('Invalid XML configuration: wrapped and attribute cannot be true at the same time.')
    }
    if (value.xml.wrapped === true) {
      delete value.xml.wrapped
      value.xml.nodeType = 'element'
    }
    if (value.xml.attribute === true) {
      delete value.xml.attribute
      value.xml.nodeType = 'attribute'
    }
  }

  for (const [key, childKind, collection] of children[kind]) {
    const child = value[key]
    if (collection && (isObject(child) || Array.isArray(child))) {
      for (const [name, member] of Object.entries(child)) {
        // Paths and Responses Objects allow extensions; named maps can use x- names.
        if (name.startsWith('x-') && (key === 'paths' || (key === 'responses' && kind === 'operation'))) {
          continue
        }
        migrateXmlObjects(member, childKind)
      }
    } else if (!collection) {
      migrateXmlObjects(child, childKind)
    }
  }

  // Callback maps have two named levels before reaching a Path Item Object.
  if ((kind === 'operation' || kind === 'components') && isObject(value.callbacks)) {
    for (const callback of Object.values(value.callbacks)) {
      if (isObject(callback)) {
        for (const [expression, pathItem] of Object.entries(callback)) {
          if (!expression.startsWith('x-') && expression !== '$ref') {
            migrateXmlObjects(pathItem, 'pathItem')
          }
        }
      }
    }
  }
}
