import { HTTP_METHODS } from '@scalar/helpers/http/http-methods'
import { isObject } from '@scalar/helpers/object/is-object'
import type { OpenAPIV2 } from '@scalar/openapi-types'
import type { UnknownObject } from '@scalar/types/utils'

import { migrateDiscriminatorMappings } from './2.0-to-3.0/migrate-discriminator-mappings'
import {
  migrateBodyParameter,
  migrateFormDataParameter,
  migrateSchema,
  parameterSchemaFields,
  transformParameterObject,
  transformResponseHeader,
  transformResponseObject,
  upgradeFromTwoToThree,
} from './2.0-to-3.0/upgrade-from-two-to-three'
import { applyChangesToDocument } from './3.0-to-3.1/upgrade-from-three-to-three-one'

/** The OpenAPI object a reference expects, independent of its storage location. */
export type FragmentKind =
  | 'document'
  | 'schema'
  | 'parameter'
  | 'header'
  | 'response'
  | 'path-item'
  | 'operation'
  | 'request-body'
  | 'callback'

/** Original and converted JSON Pointer segments, relative to the fragment root. */
export type FragmentLocation = { source: readonly string[]; output: readonly string[] }

/** Context required to interpret a fragment that has no version header. */
export type FragmentUpgradeOptions = {
  from: '2.0' | '3.0'
  to: '3.1'
  kind: FragmentKind
  consumes?: readonly string[]
  produces?: readonly string[]
  /** Inspect referenced parameters before deciding which operation field owns them. */
  resolveSource?: (ref: string) => Promise<unknown>
}

/** Converted content and the locations of original reference targets. */
export type FragmentUpgradeResult = {
  value: unknown
  locations: FragmentLocation[]
  contexts: { path: readonly string[]; consumes: readonly string[]; produces: readonly string[] }[]
}

const schemaMaps = new Set(['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'])
const schemaChildren = new Set([
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
])

type FragmentTraversalContext = {
  kind: FragmentKind
  source: string[]
  output: string[]
  consumes: readonly string[]
  produces: readonly string[]
  semanticPath: string[]
  parameterSources?: string[][]
}

/**
 * Upgrade a complete document or a typed fragment without inventing a wrapper document.
 * Literal examples and extension payloads are copied without schema transformations.
 */
export const upgradeFragment = async (
  input: unknown,
  options: FragmentUpgradeOptions,
): Promise<FragmentUpgradeResult> => {
  const locations: FragmentLocation[] = []
  const contexts: FragmentUpgradeResult['contexts'] = []
  const v2 = options.from === '2.0'
  const resolvedParameters = new Map<string, Promise<unknown>>()
  const resolveParameter = (parameter: unknown): Promise<unknown> => {
    if (!v2 || !isObject(parameter) || typeof parameter.$ref !== 'string' || !options.resolveSource) {
      return Promise.resolve(parameter)
    }
    const cached = resolvedParameters.get(parameter.$ref)
    if (cached) {
      return cached
    }
    const resolved = options.resolveSource(parameter.$ref)
    resolvedParameters.set(parameter.$ref, resolved)
    return resolved
  }
  const remember = (source: readonly string[], output: readonly string[]): void => {
    locations.push({ source, output })
  }
  const rememberFormFields = (
    parameter: UnknownObject,
    source: readonly string[],
    output: readonly string[],
    mediaTypes: readonly string[],
  ): void => {
    for (const media of mediaTypes) {
      const property = [...output, 'content', media, 'schema', 'properties', String(parameter.name)]
      for (const key of parameterSchemaFields) {
        if (Object.hasOwn(parameter, key)) {
          remember([...source, key], [...property, key])
        }
      }
    }
  }
  const visit = async (
    value: unknown,
    { kind, source, output, consumes, produces, semanticPath, parameterSources }: FragmentTraversalContext,
  ): Promise<unknown> => {
    remember(source, output)
    if (!isObject(value)) {
      return structuredClone(value)
    }
    // A declared JSON Schema dialect must not be interpreted as an OpenAPI 3.0 schema.
    if (kind === 'schema' && typeof value.$schema === 'string') {
      return structuredClone(value)
    }
    let result: UnknownObject = structuredClone(value)
    const child = (entry: unknown, childKind: FragmentKind, from: string[], to: string[] = from): Promise<unknown> =>
      visit(entry, {
        kind: childKind,
        source: [...source, ...from],
        output: [...output, ...to],
        consumes,
        produces,
        semanticPath: [...semanticPath, ...to],
      })
    const map = async (
      entries: unknown,
      childKind: FragmentKind,
      from: string[],
      to: string[] = from,
    ): Promise<UnknownObject> => {
      const converted: UnknownObject = {}
      if (!isObject(entries)) {
        return converted
      }
      for (const [name, entry] of Object.entries(entries)) {
        Object.defineProperty(converted, name, {
          value: await child(entry, childKind, [...from, name], [...to, name]),
          enumerable: true,
          configurable: true,
          writable: true,
        })
      }
      return converted
    }
    if (kind === 'document') {
      const sourceConsumes = Array.isArray(value.consumes) ? value.consumes : consumes
      const sourceProduces = Array.isArray(value.produces) ? value.produces : produces
      if (value.consumes || value.produces) {
        contexts.push({ path: output, consumes: sourceConsumes, produces: sourceProduces })
      }
      // The existing document converter owns root-only metadata such as servers and security schemes.
      const { paths, definitions, parameters, responses, components, ...metadata } = result
      result = v2 ? upgradeFromTwoToThree(metadata) : result
      result.openapi = '3.1.1'
      if (v2 && isObject(definitions)) {
        Object.values(definitions).forEach(migrateSchema)
        migrateDiscriminatorMappings(definitions)
      }
      const convertedComponents: UnknownObject = isObject(components) ? structuredClone(components) : {}
      const sections: [unknown, FragmentKind, string[], string[]][] = v2
        ? [
            [definitions, 'schema', ['definitions'], ['components', 'schemas']],
            [responses, 'response', ['responses'], ['components', 'responses']],
          ]
        : [
            [convertedComponents.schemas, 'schema', ['components', 'schemas'], ['components', 'schemas']],
            [convertedComponents.parameters, 'parameter', ['components', 'parameters'], ['components', 'parameters']],
            [convertedComponents.responses, 'response', ['components', 'responses'], ['components', 'responses']],
            [convertedComponents.headers, 'header', ['components', 'headers'], ['components', 'headers']],
            [
              convertedComponents.requestBodies,
              'request-body',
              ['components', 'requestBodies'],
              ['components', 'requestBodies'],
            ],
            [convertedComponents.pathItems, 'path-item', ['components', 'pathItems'], ['components', 'pathItems']],
            [convertedComponents.callbacks, 'callback', ['components', 'callbacks'], ['components', 'callbacks']],
          ]
      for (const [entries, childKind, from, to] of sections) {
        if (!isObject(entries)) {
          continue
        }
        const values: UnknownObject = {}
        for (const [name, entry] of Object.entries(entries)) {
          Object.defineProperty(values, name, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: await visit(entry, {
              kind: childKind,
              source: [...source, ...from, name],
              output: [...output, ...to, name],
              consumes: sourceConsumes,
              produces: sourceProduces,
              semanticPath: [...to, name],
            }),
          })
        }
        convertedComponents[to[1]!] = values
      }
      if (v2 && isObject(parameters)) {
        for (const [name, parameter] of Object.entries(parameters)) {
          const body = isObject(parameter) && (parameter.in === 'body' || parameter.in === 'formData')
          const section = body ? 'requestBodies' : 'parameters'
          const entries = isObject(convertedComponents[section]) ? convertedComponents[section] : {}
          convertedComponents[section] = entries
          Object.defineProperty(entries, name, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: await visit(parameter, {
              kind: body ? 'request-body' : 'parameter',
              source: [...source, 'parameters', name],
              output: [...output, 'components', section, name],
              consumes: sourceConsumes,
              produces: sourceProduces,
              semanticPath: ['components', section, name],
            }),
          })
        }
      }
      if (Object.keys(convertedComponents).length) {
        result.components = { ...(isObject(result.components) ? result.components : {}), ...convertedComponents }
      }
      if (isObject(paths)) {
        const convertedPaths: UnknownObject = {}
        result.paths = convertedPaths
        for (const [name, entry] of Object.entries(paths)) {
          convertedPaths[name] = name.startsWith('x-')
            ? structuredClone(entry)
            : await visit(entry, {
                kind: 'path-item',
                source: [...source, 'paths', name],
                output: [...output, 'paths', name],
                consumes: sourceConsumes,
                produces: sourceProduces,
                semanticPath: ['paths', name],
              })
        }
      }
      if (isObject(value['x-webhooks']) && !v2) {
        result.webhooks = await map(value['x-webhooks'], 'path-item', ['x-webhooks'], ['webhooks'])
      }
      delete result['x-webhooks']
      return result
    }
    if (kind === 'callback') {
      for (const [expression, pathItem] of Object.entries(value)) {
        if (!expression.startsWith('x-') && expression !== '$ref') {
          Object.defineProperty(result, expression, {
            value: await child(pathItem, 'path-item', [expression]),
            enumerable: true,
            configurable: true,
            writable: true,
          })
        }
      }
      return result
    }
    if (kind === 'path-item') {
      for (const method of HTTP_METHODS) {
        if (!isObject(value[method])) {
          continue
        }
        const operation = value[method]
        // Path-level parameters participate in each operation's effective parameter list.
        const inherited = v2 && Array.isArray(value.parameters) ? value.parameters : []
        const own = Array.isArray(operation.parameters) ? operation.parameters : []
        const ownIdentities = await Promise.all(own.map(resolveParameter))
        const effective = []
        for (const [index, parameter] of inherited.entries()) {
          const identity = await resolveParameter(parameter)
          const overridden = ownIdentities.some(
            (candidate) =>
              isObject(identity) &&
              isObject(candidate) &&
              typeof identity.name === 'string' &&
              typeof identity.in === 'string' &&
              candidate.name === identity.name &&
              candidate.in === identity.in,
          )
          if (!overridden) {
            effective.push({ parameter, source: [...source, 'parameters', String(index)] })
          }
        }
        effective.push(
          ...own.map((parameter, index) => ({ parameter, source: [...source, method, 'parameters', String(index)] })),
        )
        result[method] = await visit(
          inherited.length ? { ...operation, parameters: effective.map((entry) => entry.parameter) } : operation,
          {
            kind: 'operation',
            source: [...source, method],
            output: [...output, method],
            consumes,
            produces,
            semanticPath: [...semanticPath, method],
            parameterSources: effective.map((entry) => entry.source),
          },
        )
      }
      if (v2) {
        delete result.parameters
      } else if (Array.isArray(value.parameters)) {
        result.parameters = await Promise.all(
          value.parameters.map((parameter, index) => child(parameter, 'parameter', ['parameters', String(index)])),
        )
      }
      return result
    }
    if (kind === 'operation') {
      const effectiveConsumes = Array.isArray(value.consumes) ? value.consumes : consumes
      const effectiveProduces = Array.isArray(value.produces) ? value.produces : produces
      if (value.consumes || value.produces) {
        contexts.push({ path: output, consumes: effectiveConsumes, produces: effectiveProduces })
      }
      if (isObject(value.callbacks)) {
        result.callbacks = await map(value.callbacks, 'callback', ['callbacks'])
      }
      const parameters: unknown[] = []
      const forms: { parameter: OpenAPIV2.ParameterObject; source: string[] }[] = []
      if (Array.isArray(value.parameters)) {
        for (const [index, original] of value.parameters.entries()) {
          const parameter = await resolveParameter(original)
          const parameterSource = parameterSources?.[index] ?? [...source, 'parameters', String(index)]
          if (v2 && isObject(parameter) && parameter.in === 'formData') {
            forms.push({ parameter: structuredClone(parameter) as OpenAPIV2.ParameterObject, source: parameterSource })
          } else if (v2 && isObject(parameter) && parameter.in === 'body') {
            result.requestBody = await visit(parameter, {
              kind: 'request-body',
              source: parameterSource,
              output: [...output, 'requestBody'],
              consumes: effectiveConsumes,
              produces: effectiveProduces,
              semanticPath: [...semanticPath, 'requestBody'],
            })
          } else {
            parameters.push(
              await visit(original, {
                kind: 'parameter',
                source: parameterSource,
                output: [...output, 'parameters', String(parameters.length)],
                consumes: effectiveConsumes,
                produces: effectiveProduces,
                semanticPath: [...semanticPath, 'parameters', String(parameters.length)],
              }),
            )
          }
        }
        if (parameters.length) {
          result.parameters = parameters
        } else {
          delete result.parameters
        }
      }
      if (forms.length) {
        const body = migrateFormDataParameter(
          forms.map((entry) => entry.parameter),
          [...effectiveConsumes],
        )
        for (const form of forms) {
          rememberFormFields(form.parameter, form.source, [...output, 'requestBody'], Object.keys(body.content ?? {}))
        }
        result.requestBody = await visit(body, {
          kind: 'request-body',
          source: [...source, 'parameters'],
          output: [...output, 'requestBody'],
          consumes: effectiveConsumes,
          produces: effectiveProduces,
          semanticPath: [...semanticPath, 'requestBody'],
        })
      }
      if (isObject(value.responses)) {
        const convertedResponses: UnknownObject = {}
        result.responses = convertedResponses
        for (const [status, response] of Object.entries(value.responses)) {
          convertedResponses[status] = await visit(response, {
            kind: 'response',
            source: [...source, 'responses', status],
            output: [...output, 'responses', status],
            consumes: effectiveConsumes,
            produces: effectiveProduces,
            semanticPath: [...semanticPath, 'responses', status],
          })
        }
      }
      if (isObject(value.requestBody)) {
        result.requestBody = await child(value.requestBody, 'request-body', ['requestBody'])
      }
      delete result.consumes
      delete result.produces
      return result
    }
    if (kind === 'schema') {
      if (v2) {
        migrateSchema(result)
        if (result.type === 'file') {
          result.type = 'string'
          result.format = 'binary'
        }
      }
      for (const [key, entry] of Object.entries(result)) {
        if (schemaMaps.has(key)) {
          result[key] = await map(entry, 'schema', [key])
        } else if (schemaChildren.has(key)) {
          if (Array.isArray(entry)) {
            result[key] = await Promise.all(entry.map((item, index) => child(item, 'schema', [key, String(index)])))
          } else if (isObject(entry)) {
            result[key] = await child(entry, 'schema', [key])
          }
        }
      }
      const nullable = result.nullable === true
      const converted = applyChangesToDocument(result, semanticPath)
      if (nullable && Array.isArray(result.allOf) && converted !== result) {
        for (const location of locations) {
          const prefix = [...output, 'allOf']
          if (prefix.every((segment, index) => location.output[index] === segment)) {
            const suffix = location.output.slice(prefix.length)
            location.output = [
              ...output,
              'anyOf',
              '0',
              ...(result.allOf.length === 1 ? suffix.slice(1) : ['allOf', ...suffix]),
            ]
          }
        }
      }
      return converted
    }
    if (v2 && kind === 'parameter' && !result.$ref) {
      if (result.in === 'formData' || result.in === 'body') {
        throw new Error('Body and form parameters require an owning operation or request-body context')
      }
      result = transformParameterObject(result as OpenAPIV2.ParameterObject)
      for (const key of parameterSchemaFields) {
        if (Object.hasOwn(value, key)) {
          remember([...source, key], [...output, 'schema', key])
        }
      }
    }
    if (v2 && kind === 'header' && !result.$ref) {
      result = transformResponseHeader(result as OpenAPIV2.HeaderObject)
      for (const key of parameterSchemaFields) {
        if (Object.hasOwn(value, key)) {
          remember([...source, key], [...output, 'schema', key])
        }
      }
    }
    if (v2 && kind === 'request-body' && result.in === 'formData') {
      const body = migrateFormDataParameter([result as OpenAPIV2.ParameterObject], [...consumes])
      rememberFormFields(value, source, output, Object.keys(body.content ?? {}))
      result = body
    }
    if (v2 && kind === 'request-body' && result.in === 'body') {
      result = migrateBodyParameter(result as OpenAPIV2.ParameterObject, [...consumes])
      for (const media of consumes) {
        remember([...source, 'schema'], [...output, 'content', media, 'schema'])
      }
    }
    if (v2 && kind === 'response' && !result.$ref) {
      result = transformResponseObject(result, [...produces])
      for (const media of produces) {
        remember([...source, 'schema'], [...output, 'content', media, 'schema'])
      }
    }
    if (isObject(result.schema)) {
      const schemaSource = v2 && (kind === 'parameter' || kind === 'header') ? source : [...source, 'schema']
      result.schema = await visit(result.schema, {
        kind: 'schema',
        source: schemaSource,
        output: [...output, 'schema'],
        consumes,
        produces,
        semanticPath: [...semanticPath, 'schema'],
      })
    }
    if (isObject(result.headers)) {
      result.headers = await map(v2 && kind === 'response' ? value.headers : result.headers, 'header', ['headers'])
    }
    if (isObject(result.content)) {
      for (const [media, entry] of Object.entries(result.content)) {
        if (!isObject(entry) || entry.schema === undefined) {
          continue
        }
        const from = v2 && (kind === 'response' || value.in === 'body') ? ['schema'] : ['content', media, 'schema']
        entry.schema = await child(entry.schema, 'schema', from, ['content', media, 'schema'])
      }
    }
    // Examples on Parameter/Header/Media Type Objects retain their native shape.
    return result
  }
  const semanticPath = options.kind === 'schema' ? ['components', 'schemas', 'fragment'] : []
  const value = await visit(input, {
    kind: options.kind,
    source: [],
    output: [],
    consumes: options.consumes ?? ['application/json'],
    produces: options.produces ?? ['application/json'],
    semanticPath,
  })
  return { value, locations, contexts }
}
