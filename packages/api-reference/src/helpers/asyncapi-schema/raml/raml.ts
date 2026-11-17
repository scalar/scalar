import { isObject } from '@scalar/helpers/object/is-object'
import { RamlInclude } from '@scalar/workspace-store/helpers/async-api-schema-resources/raml-source'
import type { AsyncApiSchemaResources } from '@scalar/workspace-store/helpers/async-api-schema-resources/resources'

import { type SchemaDocument, type SchemaNode, createBudget } from '../types'
import { type RamlContext, ramlDependencies } from './dependencies'
import { expression } from './expression'
import { inferType, validateFacets } from './facets'

/** Read RAML data type fragments with file-local library scopes and bounded named references. */
export const readRaml = (source: unknown, resources?: AsyncApiSchemaResources): SchemaDocument => {
  const budget = createBudget()
  const dependencies = ramlDependencies(source, resources)
  const visit = (
    value: unknown,
    name: string,
    path = new Set<unknown>(),
    depth = 0,
    property = false,
    context: RamlContext = dependencies.root,
    names = new Set<string>(),
  ): SchemaNode => {
    budget(depth)
    if (value instanceof RamlInclude) {
      const included = dependencies.include(value, context)
      return visit(included.value, name, path, depth + 1, property, included, names)
    }
    const resolve = (type: string, level: number): SchemaNode => {
      const target = dependencies.named(type, context)
      if (names.has(target.key)) {
        if (!isObject(target.value) || (target.value.type ?? inferType(target.value)) !== 'object')
          throw new Error('Unsupported RAML recursive alias')
        return { name, type: 'object', recursive: true, referenceName: type }
      }
      return {
        ...visit(target.value, name, new Set(), level + 1, false, target.context, new Set([...names, target.key])),
        referenceName: type,
      }
    }
    const raw = value === null ? {} : value
    const rejectAnnotationIncludes = (value: unknown, depth: number): void => {
      budget(depth)
      if (value instanceof RamlInclude) throw new Error('Unsupported RAML annotation include')
      if (Array.isArray(value) || isObject(value)) {
        for (const child of Object.values(value)) rejectAnnotationIncludes(child, depth + 1)
      }
    }
    if (isObject(raw)) {
      for (const key of ['example', 'examples', 'default', 'enum']) {
        if (key in raw) rejectAnnotationIncludes(raw[key], depth + 1)
      }
    }
    const input = isObject(raw)
      ? Object.fromEntries(
          Object.entries(raw)
            .filter(([key]) => key !== 'uses' || raw !== context.value)
            .map(([key, item]) => [
              key,
              key === 'description' && item instanceof RamlInclude ? dependencies.text(item, context) : item,
            ]),
        )
      : raw
    if (typeof input === 'string') {
      return expression(input, name, budget, depth + 1, resolve)
    }
    if (!isObject(input) || path.has(input)) {
      throw new Error('Unsupported RAML type')
    }
    if ('type' in input && 'schema' in input) {
      throw new Error('Conflicting RAML type and schema facets')
    }
    const next = new Set([...path, input])
    const type = input.type ?? input.schema ?? inferType(input)
    if (typeof type !== 'string' && !(type instanceof RamlInclude)) {
      throw new Error('Unsupported RAML inheritance')
    }
    const node =
      type instanceof RamlInclude
        ? visit(type, name, next, depth + 1, false, context, names)
        : expression(type, name, budget, depth + 1, resolve)
    validateFacets(input, node, property)
    if (typeof input.description === 'string') {
      node.description = input.description
    }
    const details = Object.entries(input)
      .filter(([key]) => !['type', 'schema', 'properties', 'items', 'description', 'required'].includes(key))
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    if (details.length) {
      node.details = [...(node.details ?? []), ...details]
    }
    if ('properties' in input) {
      if (node.children || node.type !== 'object' || (input.properties !== null && !isObject(input.properties))) {
        throw new Error('Invalid RAML properties')
      }
      const fieldNames = new Set<string>()
      node.children = Object.entries(input.properties ?? {}).map(([key, property]) => {
        // Pattern properties need different presentation from literal field names.
        if (key.startsWith('/') && key.endsWith('/')) {
          throw new Error('Unsupported pattern property')
        }
        const explicitRequired = isObject(property) && Object.hasOwn(property, 'required')
        const optionalName = key.endsWith('?') && !explicitRequired
        const fieldName = optionalName ? key.slice(0, -1) : key
        if (fieldNames.has(fieldName)) {
          throw new Error('Duplicate RAML property')
        }
        fieldNames.add(fieldName)
        const child = visit(property, fieldName, next, depth + 1, true, context, names)
        const required = isObject(property) && property.required !== undefined ? property.required : !optionalName
        if (typeof required !== 'boolean') {
          throw new Error('Invalid required facet')
        }
        child.required = required
        return child
      })
    }
    if ('items' in input) {
      if (node.type !== 'array' || node.children) {
        throw new Error('Conflicting RAML items')
      }
      node.children = [visit(input.items, 'Items', next, depth + 1, false, context, names)]
    }
    return node
  }
  return { nodes: [visit(dependencies.root.value, 'Schema')] }
}
