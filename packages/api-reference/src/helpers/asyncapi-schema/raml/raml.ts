import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiSchemaResources } from '@scalar/workspace-store/helpers/async-api-schema-resources/resources'

import { type SchemaDocument, type SchemaNode, createBudget } from '../types'
import { type RamlContext, ramlDependencies } from './dependencies'
import { expression } from './expression'
import { inferType, validateFacets } from './facets'

/** Traversal scope is explicit so includes and named references cannot exchange their file or cycle state. */
type VisitContext = {
  path: Set<unknown>
  depth: number
  property: boolean
  context: RamlContext
  names: Set<string>
}

/** Read RAML data type fragments with file-local library scopes and bounded named references. */
export const readRaml = (source: unknown, resources?: AsyncApiSchemaResources): SchemaDocument => {
  const budget = createBudget()
  const dependencies = ramlDependencies(source, resources)
  const visit = (value: unknown, name: string, state: VisitContext): SchemaNode => {
    const { path, depth, property, names } = state
    const context = dependencies.contextFor(value, state.context)
    budget(depth)
    const raw = value === null ? {} : value
    const typeContext = dependencies.contextForChild(
      raw,
      isObject(raw) && raw.type !== undefined ? 'type' : 'schema',
      context,
    )
    const resolve = (type: string, level: number): SchemaNode => {
      const target = dependencies.named(type, typeContext)
      if (names.has(target.key)) {
        if (!isObject(target.value) || (target.value.type ?? inferType(target.value)) !== 'object')
          throw new Error('Unsupported RAML recursive alias')
        return { name, type: 'object', recursive: true, referenceName: type }
      }
      return {
        ...visit(target.value, name, {
          path: new Set(),
          depth: level + 1,
          property: false,
          context: target.context,
          names: new Set([...names, target.key]),
        }),
        referenceName: type,
      }
    }
    const input = isObject(raw)
      ? Object.fromEntries(Object.entries(raw).filter(([key]) => key !== 'uses' || raw !== context.value))
      : raw
    if (typeof input === 'string') return expression(input, name, budget, depth + 1, resolve)
    if (!isObject(input) || path.has(raw)) throw new Error('Unsupported RAML type')
    if ('type' in input && 'schema' in input) throw new Error('Conflicting RAML type and schema facets')
    const next = { ...state, context, path: new Set([...path, raw]), depth: depth + 1 }
    const type = input.type ?? input.schema ?? inferType(input)
    if (typeof type !== 'string' && typeContext === context) throw new Error('Unsupported RAML inheritance')
    const node =
      typeof type === 'string'
        ? expression(type, name, budget, depth + 1, resolve)
        : visit(type, name, { ...next, property: false, context: typeContext })
    validateFacets(input, node, property)
    if (typeof input.description === 'string') node.description = input.description
    const details = Object.entries(input)
      .filter(([key]) => !['type', 'schema', 'properties', 'items', 'description', 'required'].includes(key))
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    if (details.length) node.details = [...(node.details ?? []), ...details]
    if ('properties' in input) {
      const properties = input.properties
      const propertyContext = dependencies.contextFor(properties, context)
      if (node.children || node.type !== 'object' || (properties !== null && !isObject(properties)))
        throw new Error('Invalid RAML properties')
      const fieldNames = new Set<string>()
      node.children = Object.entries(properties ?? {}).map(([key, value]) => {
        if (key.startsWith('/') && key.endsWith('/')) throw new Error('Unsupported pattern property')
        const property = value
        const explicitRequired = isObject(property) && Object.hasOwn(property, 'required')
        const optionalName = key.endsWith('?') && !explicitRequired
        const fieldName = optionalName ? key.slice(0, -1) : key
        if (fieldNames.has(fieldName)) throw new Error('Duplicate RAML property')
        fieldNames.add(fieldName)
        const child = visit(property, fieldName, {
          ...next,
          property: true,
          context: dependencies.contextForChild(properties, key, propertyContext),
        })
        const required = isObject(property) && property.required !== undefined ? property.required : !optionalName
        if (typeof required !== 'boolean') throw new Error('Invalid required facet')
        child.required = required
        return child
      })
    }
    if ('items' in input) {
      if (node.type !== 'array' || node.children) throw new Error('Conflicting RAML items')
      node.children = [
        visit(input.items, 'Items', {
          ...next,
          property: false,
          context: dependencies.contextForChild(raw, 'items', context),
        }),
      ]
    }
    return node
  }
  return {
    nodes: [
      visit(dependencies.root.value, 'Schema', {
        path: new Set(),
        depth: 0,
        property: false,
        context: dependencies.root,
        names: new Set(),
      }),
    ],
  }
}
