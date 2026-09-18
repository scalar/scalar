import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'
import { isSchemaPath } from '@scalar/helpers/openapi/is-schema-path'

const schemaMaps = new Set(['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'])
const schemaArrays = new Set(['allOf', 'anyOf', 'oneOf', 'prefixItems'])
const childSchemas = new Set([
  'items',
  'not',
  'if',
  'then',
  'else',
  'contains',
  'propertyNames',
  'contentSchema',
  '$ref-value',
])
const openApiMaps = new Set([
  'paths',
  'webhooks',
  'responses',
  'content',
  'headers',
  'examples',
  'links',
  'encoding',
  'variables',
  'parameters',
  'requestBodies',
  'securitySchemes',
  'pathItems',
  'mediaTypes',
  'additionalOperations',
  'callbacks',
  'x-ext',
])
const opaqueValues = new Set(['example', 'examples', 'default', 'enum', 'const', 'value', 'dataValue'])

type Node = {
  source: object
  parent?: { node: Node; key: string }
  otherParents?: { node: Node; key: string }[]
  replacements?: Map<string, unknown>
  copy?: object
}

type Task = { node: Node; kind: 'schema' } | { node: Node; kind: 'document'; path: string[]; mapDepth: number }

/**
 * Normalize boolean schemas without mutating caller-owned data.
 * Only changed schema containers and their ancestors are copied. Unchanged bundled
 * documents and opaque example/extension payloads retain their identity. Iterative
 * discovery and copy propagation preserve cycles without recursive cloning.
 * The marker represents an untyped schema; false is its negation. additionalProperties
 * already accepts booleans and therefore retains its authored representation.
 */
export const normalizeBooleanSchemas = <T extends Record<string, unknown>>(document: T): T => {
  const nodes = new WeakMap<object, Node>()
  const changed = new Set<Node>()
  const schemas = new WeakSet<object>()
  const documents = new WeakSet<object>()
  const tasks: Task[] = []
  const getNode = (source: object): Node => {
    const existing = nodes.get(source)
    if (existing) {
      return existing
    }
    const node: Node = { source }
    nodes.set(source, node)
    return node
  }
  const root = getNode(document)
  const link = (parent: Node, key: string, child: object): Node => {
    const node = getNode(child)
    if (!node.parent) {
      node.parent = { node: parent, key }
    } else if (node.parent.node !== parent || node.parent.key !== key) {
      const parents = (node.otherParents ??= [])
      if (!parents.some((edge) => edge.node === parent && edge.key === key)) {
        parents.push({ node: parent, key })
      }
    }
    return node
  }
  const schema = (parent: Node, key: string, value: unknown): void => {
    if (typeof value === 'boolean') {
      ;(parent.replacements ??= new Map()).set(
        key,
        value ? { __scalar_: '' } : { __scalar_: '', not: { __scalar_: '' } },
      )
      changed.add(parent)
    } else if (isObject(value)) {
      tasks.push({ node: link(parent, key, value), kind: 'schema' })
    }
  }
  const reference = (pointer: string): void => {
    const segments = parseJsonPointerSegments(pointer)
    let parent = root
    for (const [index, key] of segments.entries()) {
      // A local reference cannot reach inherited properties or prototype setters.
      if (!Object.hasOwn(parent.source, key)) {
        return
      }
      const value: unknown = Reflect.get(parent.source, key)
      if (index === segments.length - 1) {
        schema(parent, key, value)
      } else if (value !== null && typeof value === 'object') {
        parent = link(parent, key, value)
      } else {
        return
      }
    }
  }

  tasks.push({ node: root, kind: 'document', path: [], mapDepth: 0 })
  while (tasks.length > 0) {
    const task = tasks.pop()
    if (!task) {
      break
    }
    const { node } = task
    const visited = task.kind === 'schema' ? schemas : documents
    if (visited.has(node.source)) {
      continue
    }
    visited.add(node.source)
    if (task.kind === 'schema') {
      const value = node.source as Record<string, unknown>
      if (typeof value.$ref === 'string' && value.$ref.startsWith('#/')) {
        reference(value.$ref.slice(1))
      }
      for (const [key, child] of Object.entries(value)) {
        if ((schemaMaps.has(key) && isObject(child)) || (schemaArrays.has(key) && Array.isArray(child))) {
          const container = link(node, key, child)
          for (const [name, nested] of Object.entries(child)) {
            schema(container, name, nested)
          }
        } else if (childSchemas.has(key)) {
          schema(node, key, child)
        } else if (
          ['additionalProperties', 'unevaluatedProperties', 'unevaluatedItems'].includes(key) &&
          isObject(child)
        ) {
          schema(node, key, child)
        }
      }
      continue
    }
    const { path } = task
    for (const [key, child] of Object.entries(node.source)) {
      const childPath = [...path, key]
      const isMapEntry = task.mapDepth > 0
      if (key === 'schemas' && path.at(-1) === 'components' && isObject(child)) {
        const container = link(node, key, child)
        for (const [name, nested] of Object.entries(child)) {
          schema(container, name, nested)
        }
      } else if ((key === 'schema' || key === 'itemSchema') && !isMapEntry && isSchemaPath(childPath)) {
        schema(node, key, child)
      } else if (isMapEntry || (!opaqueValues.has(key) && (!key.startsWith('x-') || key === 'x-ext'))) {
        // Vendor extensions are opaque. x-ext additionally contains bundled documents
        // and schema targets whose context can be supplied by a local reference.
        if (child !== null && typeof child === 'object') {
          tasks.push({
            node: link(node, key, child),
            kind: 'document',
            path: childPath,
            mapDepth: isMapEntry ? task.mapDepth - 1 : key === 'callbacks' ? 2 : openApiMaps.has(key) ? 1 : 0,
          })
        }
      }
    }
  }

  const forEachParent = (node: Node, callback: (parent: { node: Node; key: string }) => void): void => {
    if (node.parent) {
      callback(node.parent)
    }
    node.otherParents?.forEach(callback)
  }
  // Set iteration also visits newly added ancestors, including shared/cyclic parents.
  for (const node of changed) {
    forEachParent(node, (parent) => changed.add(parent.node))
  }
  for (const node of changed) {
    node.copy = Array.isArray(node.source) ? [] : {}
  }
  for (const node of changed) {
    forEachParent(node, (parent) => (parent.node.replacements ??= new Map()).set(parent.key, node.copy))
  }
  for (const node of changed) {
    for (const [key, value] of Object.entries(node.source)) {
      // Define an own data property so authored keys such as __proto__ remain data.
      Object.defineProperty(node.copy, key, {
        value: node.replacements?.has(key) ? node.replacements.get(key) : value,
        enumerable: true,
        writable: true,
        configurable: true,
      })
    }
  }
  return (root.copy ?? document) as T
}
