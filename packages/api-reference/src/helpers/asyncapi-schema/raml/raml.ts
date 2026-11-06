import { isObject } from '@scalar/helpers/object/is-object'
import { parseDocument } from 'yaml'

import { type SchemaDocument, type SchemaNode, createBudget } from '../types'
import { expression } from './expression'
import { inferType, validateFacets } from './facets'

/** Read self-contained RAML 1.0 data type fragments; includes and libraries remain source. */
export const readRaml = (source: unknown): SchemaDocument => {
  const budget = createBudget()
  const value =
    typeof source === 'string'
      ? ((): unknown => {
          if (/^#%RAML/m.test(source) && !/^#%RAML 1\.0 DataType[ \t]*(?:\r?\n|$)/.test(source)) {
            throw new Error('Not a data type fragment')
          }
          const document = parseDocument(source)
          if (document.errors.length || document.warnings.length) {
            throw new Error('Invalid RAML YAML')
          }
          return document.toJS({ maxAliasCount: 50 })
        })()
      : source
  const visit = (value: unknown, name: string, path = new Set<unknown>(), depth = 0, property = false): SchemaNode => {
    const input = value === null ? {} : value
    budget(depth)
    if (typeof input === 'string') {
      return expression(input, name, budget, depth + 1)
    }
    if (!isObject(input) || path.has(input)) {
      throw new Error('Unsupported RAML type')
    }
    if ('type' in input && 'schema' in input) {
      throw new Error('Conflicting RAML type and schema facets')
    }
    const next = new Set([...path, input])
    const type = input.type ?? input.schema ?? inferType(input)
    if (typeof type !== 'string') {
      throw new Error('Unsupported RAML inheritance')
    }
    const node = expression(type, name, budget, depth + 1)
    validateFacets(input, node, property)
    if (typeof input.description === 'string') {
      node.description = input.description
    }
    const details = Object.entries(input)
      .filter(([key]) => !['type', 'schema', 'properties', 'items', 'description', 'required'].includes(key))
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    if (details.length) {
      node.details = details
    }
    if ('properties' in input) {
      if (node.type !== 'object' || (input.properties !== null && !isObject(input.properties))) {
        throw new Error('Invalid RAML properties')
      }
      const names = new Set<string>()
      node.children = Object.entries(input.properties ?? {}).map(([key, property]) => {
        // Pattern properties need different presentation from literal field names.
        if (key.startsWith('/') && key.endsWith('/')) {
          throw new Error('Unsupported pattern property')
        }
        const explicitRequired = isObject(property) && Object.hasOwn(property, 'required')
        const optionalName = key.endsWith('?') && !explicitRequired
        const fieldName = optionalName ? key.slice(0, -1) : key
        if (names.has(fieldName)) {
          throw new Error('Duplicate RAML property')
        }
        names.add(fieldName)
        const child = visit(property, fieldName, next, depth + 1, true)
        const required = isObject(property) && property.required !== undefined ? property.required : !optionalName
        if (typeof required !== 'boolean') {
          throw new Error('Invalid required facet')
        }
        child.details = [required ? 'Required' : 'Optional', ...(child.details ?? [])]
        return child
      })
    }
    if ('items' in input) {
      if (node.type !== 'array' || node.children) {
        throw new Error('Conflicting RAML items')
      }
      node.children = [visit(input.items, 'Items', next, depth + 1)]
    }
    return node
  }
  return { nodes: [visit(value, 'Schema')] }
}
