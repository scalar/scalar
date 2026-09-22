import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

import { UpgradeIncompatibilityError } from '../upgrade-incompatibility-error'

type Kind =
  | 'document'
  | 'pathItem'
  | 'operation'
  | 'parameter'
  | 'header'
  | 'body'
  | 'response'
  | 'callback'
  | 'media'
  | 'encoding'
  | 'schema'
  | 'server'

/** Naming and resolution state inherited while validating XML schemas. */
type XmlContext = {
  inferredName: boolean
  propertyName: boolean
  dialect: unknown
  ancestors?: Set<object>
  baseChanged?: boolean
}

const schemaMaps = ['properties', 'patternProperties', '$defs', 'dependentSchemas']
const schemaArrays = ['allOf', 'anyOf', 'oneOf', 'prefixItems']
const schemaSingles = [
  'items',
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
]

/** Reject only incompatibilities that can be established within this document. */
export const migrateObjects = (document: UnknownObject): Set<string> => {
  // A cloned JSON object still inherits Object.prototype. Keep traversal in own
  // data properties, including when the host already has polluted prototypes.
  // Maps also allow literal __proto__ and constructor reference segments safely.
  const properties = new WeakMap<object, Map<string, unknown>>()
  const own = (value: object, key: string): unknown => {
    const entries =
      properties.get(value) ??
      new Map(
        Object.entries(Object.getOwnPropertyDescriptors(value))
          .filter(([, descriptor]) => Object.hasOwn(descriptor, 'value'))
          .map(([name, descriptor]) => [name, descriptor.value]),
      )
    properties.set(value, entries)
    return entries.get(key)
  }
  const operationTags = new Set<string>()
  const errors: Error[] = []
  const requiredCache = new WeakMap<object, Map<string, boolean | undefined>>()
  const cyclicRequired = new WeakSet<object>()
  const requiredWork = { evaluations: 0 }
  const propertySchemas = new WeakSet<object>()
  const xmlRoots: { schema: unknown; path: string; dialect: unknown }[] = []
  // Only property schemas and their array items inherit a property name.
  const markPropertySchema = (schema: unknown): void => {
    if (!isObject(schema) || propertySchemas.has(schema)) {
      return
    }
    propertySchemas.add(schema)
    markPropertySchema(schema.items)
    if (Array.isArray(schema.prefixItems)) {
      schema.prefixItems.forEach(markPropertySchema)
    }
  }
  const xmlCache = new WeakMap<object, Set<string>>()
  const visited = new WeakMap<object, Set<string>>()
  const fail = (path: string, message: string): void => {
    errors.push(new Error(`Cannot upgrade to OpenAPI 3.2 at ${path}: ${message}`))
  }
  const resolve = (ref: unknown, schemaReference = false): unknown => {
    if (typeof ref !== 'string' || !ref.startsWith('#/')) {
      return undefined
    }
    try {
      return parseJsonPointerSegments(decodeURIComponent(ref.slice(1))).reduce<unknown>((value, key) => {
        // A pointer crossing a schema resource boundary cannot be interpreted
        // with the containing document's dialect and base URI.
        if (schemaReference && isObject(value) && (value.$id !== undefined || value.$schema !== undefined)) {
          return undefined
        }
        if (Array.isArray(value) && !/^(0|[1-9]\d*)$/.test(key)) {
          return undefined
        }
        // Read only stored values, never inherited properties or accessors.
        if ((!isObject(value) && !Array.isArray(value)) || !Object.hasOwn(value, key)) {
          return undefined
        }
        return own(value, key)
      }, document)
    } catch {
      return undefined
    }
  }
  const repeatedVariables = (value: unknown, path: string): void => {
    if (typeof value !== 'string') {
      return
    }
    const names = [...value.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1])
    if (new Set(names).size !== names.length) {
      fail(path, 'Template variables must not be repeated. Rename the repeated variable and define it separately.')
    }
  }

  // Requiredness can be inherited through references or composition. Unknown
  // references and conditional constraints must not be mistaken for optionality.
  const requires = (schema: unknown, name: string, seen = new Set<object>()): boolean | undefined => {
    if (schema === false) {
      return true
    }
    if (schema === true) {
      return false
    }
    if (!isObject(schema) || schema.$id !== undefined || schema.$schema !== undefined) {
      return undefined
    }
    if (seen.has(schema)) {
      // Do not cache uncertain results that depend on the active ancestor chain.
      for (const ancestor of seen) {
        cyclicRequired.add(ancestor)
      }
      return undefined
    }
    const cached = requiredCache.get(schema) ?? new Map<string, boolean | undefined>()
    if (cached.has(name)) {
      return cached.get(name)
    }
    // Cyclic or unusually large analyses remain uncertain rather than blocking
    // upgrading indefinitely. Completed acyclic subgraphs are memoized below.
    if (++requiredWork.evaluations > 100_000) {
      if (requiredWork.evaluations === 100_001) {
        fail('#', 'Discriminator requiredness analysis was truncated after 100,000 evaluations.')
      }
      return undefined
    }
    const remember = (result: boolean | undefined): boolean | undefined => {
      if (result !== undefined || !cyclicRequired.has(schema)) {
        cached.set(name, result)
        requiredCache.set(schema, cached)
      }
      return result
    }
    if (Array.isArray(schema.required) && schema.required.includes(name)) {
      return remember(true)
    }
    const next = new Set([...seen, schema])
    const constraints: (boolean | undefined)[] = []
    if (schema.$ref !== undefined) {
      constraints.push(requires(resolve(schema.$ref, true), name, next))
    }
    if (Array.isArray(schema.allOf)) {
      constraints.push(...schema.allOf.map((item) => requires(item, name, next)))
    }
    for (const keyword of ['oneOf', 'anyOf']) {
      if (Array.isArray(schema[keyword])) {
        const alternatives = schema[keyword].map((item: unknown) => requires(item, name, next))
        if (alternatives.every((value: boolean | undefined) => value === true)) {
          constraints.push(true)
        } else if (alternatives.every((value: boolean | undefined) => value === false)) {
          constraints.push(false)
        } else {
          constraints.push(undefined)
        }
      }
    }
    if (constraints.includes(true)) {
      return remember(true)
    }
    if (
      constraints.includes(undefined) ||
      ['if', 'not', '$dynamicRef', 'const', 'enum', 'minProperties', 'dependentRequired', 'dependentSchemas'].some(
        (key) => key in schema,
      )
    ) {
      return remember(undefined)
    }
    return remember(false)
  }

  // An array wrapper name is not a property name: only arrays under
  // properties can pass an inferred name to their inline item schemas.
  const validateXmlNames = (
    schema: unknown,
    path: string,
    { inferredName, propertyName, dialect, ancestors = new Set<object>(), baseChanged = false }: XmlContext,
  ): void => {
    if (!isObject(schema) || ancestors.has(schema) || (schema.$schema ?? dialect) !== undefined) {
      return
    }
    const changedBase = baseChanged || schema.$id !== undefined
    const context = [inferredName, propertyName, changedBase].join(':')
    const completed = xmlCache.get(schema) ?? new Set<string>()
    if (completed.has(context)) {
      return
    }
    const xml = isObject(schema.xml) ? schema.xml : {}
    const defaultNodeType =
      schema.$ref !== undefined || schema.$dynamicRef !== undefined || schema.type === 'array' ? 'none' : 'element'
    const wrappedNodeType = xml.wrapped === true ? 'element' : defaultNodeType
    const nodeType = xml.nodeType ?? (xml.attribute === true ? 'attribute' : wrappedNodeType)
    if ((nodeType === 'element' || nodeType === 'attribute') && !inferredName && xml.name === undefined) {
      fail(path, 'An inline XML element needs an explicit xml.name.')
    }
    const childContext = { dialect, ancestors: new Set([...ancestors, schema]), baseChanged: changedBase }
    if (!changedBase && typeof schema.$ref === 'string') {
      const target = resolve(schema.$ref, true)
      if (isObject(target)) {
        const segments = parseJsonPointerSegments(decodeURIComponent(schema.$ref.slice(1)))
        const componentRoot = segments.length === 3 && segments[0] === 'components' && segments[1] === 'schemas'
        const fromProperty = propertySchemas.has(target)
        validateXmlNames(target, schema.$ref, {
          ...childContext,
          inferredName: componentRoot || fromProperty,
          propertyName: fromProperty,
        })
      }
    }
    // Composition branches are neither properties nor components, so they cannot inherit a name.
    for (const keyword of ['allOf', 'anyOf', 'oneOf']) {
      const branches = schema[keyword]
      if (Array.isArray(branches)) {
        branches.forEach((branch: unknown, index: number) =>
          validateXmlNames(branch, path + '/' + keyword + '/' + index, {
            ...childContext,
            inferredName: false,
            propertyName: false,
          }),
        )
      }
    }
    validateXmlNames(schema.items, path + '/items', { ...childContext, inferredName: propertyName, propertyName })
    if (Array.isArray(schema.prefixItems)) {
      schema.prefixItems.forEach((item: unknown, index: number) =>
        validateXmlNames(item, path + '/prefixItems/' + index, {
          ...childContext,
          inferredName: propertyName,
          propertyName,
        }),
      )
    }
    if (isObject(schema.properties)) {
      for (const [name, property] of Object.entries(schema.properties)) {
        validateXmlNames(property, path + '/properties/' + escapeJsonPointer(name), {
          ...childContext,
          inferredName: true,
          propertyName: true,
        })
      }
    }
    completed.add(context)
    xmlCache.set(schema, completed)
  }

  const visit = (
    value: unknown,
    kind: Kind,
    path: string,
    dialect: unknown = document.jsonSchemaDialect,
    baseChanged = false,
  ): void => {
    if (!isObject(value)) {
      return
    }
    const schemaDialect = kind === 'schema' ? (value.$schema ?? dialect) : dialect
    const schemaBaseChanged = baseChanged || (kind === 'schema' && value.$id !== undefined)
    const visitKey = `${kind}:${String(schemaDialect)}:${schemaBaseChanged}`
    const seen = visited.get(value) ?? new Set<string>()
    if (seen.has(visitKey)) {
      return
    }
    seen.add(visitKey)
    visited.set(value, seen)
    const child = (key: string, type: Kind): void =>
      visit(own(value, key), type, `${path}/${escapeJsonPointer(key)}`, schemaDialect, schemaBaseChanged)
    const list = (key: string, type: Kind): void => {
      const items = own(value, key)
      if (Array.isArray(items)) {
        items.forEach((item: unknown, index: number) =>
          visit(item, type, `${path}/${key}/${index}`, schemaDialect, schemaBaseChanged),
        )
      }
    }
    const map = (key: string, type: Kind): void => {
      const items = own(value, key)
      if (isObject(items)) {
        for (const [name, item] of Object.entries(items)) {
          if (key === 'responses' && name.startsWith('x-')) {
            continue
          }
          if (kind === 'schema' && key === 'properties') {
            markPropertySchema(item)
          }
          visit(item, type, `${path}/${key}/${escapeJsonPointer(name)}`, schemaDialect, schemaBaseChanged)
        }
      }
    }

    if (kind === 'schema') {
      // A pinned older or custom dialect still owns the meaning of its XML keywords.
      if (schemaDialect !== undefined) {
        return
      }
      const xml = own(value, 'xml')
      if (isObject(xml)) {
        if (xml.wrapped === true && xml.attribute === true) {
          fail(`${path}/xml`, 'wrapped and attribute cannot both be true.')
        }
        if (xml.wrapped === true || xml.attribute === true) {
          xml.nodeType = xml.attribute === true ? 'attribute' : 'element'
          delete xml.wrapped
          delete xml.attribute
        }
      }
      if (!schemaBaseChanged && value.$ref !== undefined) {
        visit(resolve(value.$ref, true), 'schema', String(value.$ref), schemaDialect)
      }
      const discriminator = value.discriminator
      if (
        isObject(discriminator) &&
        typeof discriminator.propertyName === 'string' &&
        discriminator.defaultMapping === undefined &&
        !schemaBaseChanged &&
        requires(value, discriminator.propertyName) === false
      ) {
        fail(`${path}/discriminator`, 'An optional discriminating property needs an explicit defaultMapping.')
      }
      for (const key of schemaMaps) {
        map(key, 'schema')
      }
      for (const key of schemaArrays) {
        list(key, 'schema')
      }
      for (const key of schemaSingles) {
        child(key, 'schema')
      }
      return
    }

    // Reference targets outside components can still contain OpenAPI objects.
    if (value.$ref !== undefined) {
      visit(resolve(value.$ref), kind, String(value.$ref), schemaDialect)
    }
    switch (kind) {
      case 'document': {
        const paths = own(value, 'paths')
        if (isObject(paths)) {
          for (const [name, item] of Object.entries(paths)) {
            if (!name.startsWith('/')) {
              continue
            }
            const location = `${path}/paths/${escapeJsonPointer(name)}`
            repeatedVariables(name, location)
            visit(item, 'pathItem', location)
          }
        }
        map('webhooks', 'pathItem')
        list('servers', 'server')
        const componentObjects = own(value, 'components')
        if (isObject(componentObjects)) {
          const components: Record<string, Kind> = {
            schemas: 'schema',
            parameters: 'parameter',
            headers: 'header',
            requestBodies: 'body',
            responses: 'response',
            callbacks: 'callback',
            pathItems: 'pathItem',
          }
          for (const [key, type] of Object.entries(components)) {
            const entries = own(componentObjects, key)
            if (isObject(entries)) {
              for (const [name, item] of Object.entries(entries)) {
                visit(item, type, `${path}/components/${key}/${escapeJsonPointer(name)}`)
              }
            }
          }
        }
        break
      }
      case 'pathItem':
        for (const method of ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']) {
          child(method, 'operation')
        }
        list('parameters', 'parameter')
        list('servers', 'server')
        break
      case 'operation':
        if (Array.isArray(value.tags)) {
          for (const tag of value.tags) {
            if (typeof tag === 'string') {
              operationTags.add(tag)
            }
          }
        }
        list('parameters', 'parameter')
        list('servers', 'server')
        child('requestBody', 'body')
        map('responses', 'response')
        map('callbacks', 'callback')
        break
      case 'callback':
        for (const [name, item] of Object.entries(value)) {
          if (!name.startsWith('x-') && name !== '$ref') {
            visit(item, 'pathItem', `${path}/${escapeJsonPointer(name)}`, schemaDialect, schemaBaseChanged)
          }
        }
        break
      case 'parameter':
        // These settings were ignored in 3.1, but would become active in 3.2.
        if (value.in === 'path' || value.in === 'cookie') {
          delete value.allowReserved
        }
        child('schema', 'schema')
        map('content', 'media')
        break
      case 'header':
        child('schema', 'schema')
        map('content', 'media')
        break
      case 'response':
        map('headers', 'header')
        map('content', 'media')
        break
      case 'body':
        map('content', 'media')
        break
      case 'media':
        if (/\/(?:[^;]+\+)?xml(?:\s*;|$)/i.test(path.slice(path.lastIndexOf('/') + 1).replace(/~1/g, '/'))) {
          xmlRoots.push({ schema: value.schema, path: `${path}/schema`, dialect: schemaDialect })
        }
        child('schema', 'schema')
        map('encoding', 'encoding')
        break
      case 'encoding':
        map('headers', 'header')
        break
      case 'server':
        repeatedVariables(value.url, `${path}/url`)
        break
    }
  }
  visit(document, 'document', '#')
  // Resolve naming after traversal, so forward references have their structural context.
  for (const { schema, path, dialect } of xmlRoots) {
    validateXmlNames(schema, path, { inferredName: false, propertyName: false, dialect })
  }
  if (errors.length > 0) {
    throw new UpgradeIncompatibilityError(errors)
  }
  return operationTags
}
