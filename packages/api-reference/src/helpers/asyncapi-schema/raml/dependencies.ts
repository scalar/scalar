import { isObject } from '@scalar/helpers/object/is-object'
import {
  RamlInclude,
  type RamlPosition,
  parseRamlSource,
  ramlChildPosition,
} from '@scalar/workspace-store/helpers/async-api-schema-resources/raml-source'
import type { AsyncApiSchemaResources } from '@scalar/workspace-store/helpers/async-api-schema-resources/resources'
import { schemaResourcePath } from '@scalar/workspace-store/helpers/async-api-schema-resources/schema-resource-path'

/** Typed fragments own their aliases; untyped includes retain the declaring scope and their own location. */
export type RamlContext = {
  value: unknown
  uri: string
  types: Record<string, unknown>
  libraries: Map<string, RamlContext>
  dependencyDepth: number
  scope?: RamlContext
}

/** Substitute includes before interpretation, retaining file provenance separately from authored values. */
export const ramlDependencies = (
  source: unknown,
  resources?: AsyncApiSchemaResources,
): {
  root: RamlContext
  contextFor: (value: unknown, fallback: RamlContext) => RamlContext
  contextForChild: (parent: unknown, key: string, fallback: RamlContext) => RamlContext
  named: (name: string, context: RamlContext) => { value: unknown; context: RamlContext; key: string }
} => {
  const contexts = new WeakMap<object, RamlContext>()
  const children = new WeakMap<object, Map<string, RamlContext>>()
  const active = new Set<string>()
  const loaded = new Set<string>()
  const parsed = new Map<string, unknown>()
  const state = { size: typeof source === 'string' ? source.length : 0, nodes: 0 }
  const budget = (depth: number): void => {
    if (depth > 40 || ++state.nodes > 10_000 || state.size > 1_000_000)
      throw new Error('RAML dependencies are too large')
  }
  const read = (path: string, context: RamlContext): { content: string; uri: string } => {
    const uri = schemaResourcePath(context.uri, path)
    const content = resources && Object.hasOwn(resources.files, uri) ? resources.files[uri] : undefined
    if (typeof content !== 'string' || content.length > 200_000) throw new Error('Missing RAML dependency')
    if (!loaded.has(uri)) {
      loaded.add(uri)
      state.size += content.length
      if (loaded.size > 64) throw new Error('Too many RAML dependencies')
    }
    return { content, uri }
  }
  const create = (
    source: unknown,
    uri: string,
    position: RamlPosition,
    depth: number,
    dependencyDepth: number,
    parent?: RamlContext,
  ): RamlContext => {
    budget(depth)
    if (dependencyDepth > 20) throw new Error('RAML dependency graph is too deep')
    if (active.has(uri)) throw new Error('Cyclic RAML dependencies')
    active.add(uri)
    const header = typeof source === 'string' && /^#%RAML/m.test(source)
    const allowedHeader =
      position === 'library'
        ? /^#%RAML 1\.0 Library[ \t]*(?:\r?\n|$)/
        : position === 'schema'
          ? /^#%RAML 1\.0 DataType[ \t]*(?:\r?\n|$)/
          : undefined
    if (header && !allowedHeader?.test(String(source))) throw new Error('Unsupported RAML fragment')
    if (position === 'library' && !header) throw new Error('Expected RAML library')
    const rawText = position === 'text' && !/\.(?:raml|ya?ml)(?:[?]|$)/i.test(uri)
    if (typeof source === 'string' && !rawText && !parsed.has(uri)) parsed.set(uri, parseRamlSource(source))
    // Expansion clones the parsed tree, so repeated files can share parsing without sharing aliases or scopes.
    const value = typeof source === 'string' && !rawText ? parsed.get(uri) : source
    const inherits = parent && !header && position !== 'library'
    const context: RamlContext = {
      value,
      uri,
      dependencyDepth,
      types: inherits ? parent.types : {},
      libraries: new Map(inherits ? parent.libraries : []),
      ...(inherits ? { scope: parent.scope ?? parent } : {}),
    }
    const object = isObject(value) && !(value instanceof RamlInclude) ? value : {}
    if (inherits && position === 'schema' && 'uses' in object)
      throw new Error('Only typed RAML fragments can declare libraries')
    if (
      position === 'library' &&
      Object.keys(object).some((key) => !['uses', 'types', 'usage', 'description'].includes(key))
    )
      throw new Error('Unsupported RAML library declarations')
    if (position === 'schema' || position === 'library') {
      if ('uses' in object && !isObject(object.uses)) throw new Error('Invalid RAML uses')
      for (const [alias, path] of Object.entries(isObject(object.uses) ? object.uses : {})) {
        if (!/^[A-Za-z_][A-Za-z_0-9-]*$/.test(alias) || typeof path !== 'string')
          throw new Error('Invalid RAML library alias')
        const { content, uri } = read(path, context)
        context.libraries.set(alias, create(content, uri, 'library', depth + 1, dependencyDepth + 1))
      }
    }
    if (value instanceof RamlInclude) {
      const { content, uri: includedUri } = read(value.path, context)
      const included = create(content, includedUri, position, depth + 1, dependencyDepth + 1, context)
      active.delete(uri)
      return included
    }
    context.value = expand(value, context, position, depth + 1)
    if (position === 'library') {
      const expanded = isObject(context.value) ? context.value : {}
      if (expanded.types !== undefined && !isObject(expanded.types)) throw new Error('Invalid RAML types')
      context.types = isObject(expanded.types) ? expanded.types : {}
    }
    active.delete(uri)
    return context
  }
  const path = new Set<object>()
  const expand = (value: unknown, context: RamlContext, position: RamlPosition, depth: number): unknown => {
    budget(depth)
    if (value instanceof RamlInclude) {
      const { content, uri } = read(value.path, context)
      return create(content, uri, position, depth + 1, context.dependencyDepth + 1, context).value
    }
    if (!isObject(value) && !Array.isArray(value)) return value
    if (path.has(value)) throw new Error('Cyclic RAML YAML aliases')
    path.add(value)
    const locations = new Map<string, RamlContext>()
    const child = (key: string, value: unknown, position: RamlPosition): unknown => {
      if (!(value instanceof RamlInclude)) return expand(value, context, position, depth + 1)
      const { content, uri } = read(value.path, context)
      const included = create(content, uri, position, depth + 1, context.dependencyDepth + 1, context)
      locations.set(key, included)
      return included.value
    }
    const result = Array.isArray(value)
      ? value.map((value, index) => child(String(index), value, position))
      : Object.fromEntries(
          Object.entries(value).map(([key, value]) => [key, child(key, value, ramlChildPosition(position, key))]),
        )
    contexts.set(result, context)
    children.set(result, locations)
    path.delete(value)
    return result
  }
  const root = create(source, resources?.origin ?? '', 'schema', 0, 0)
  return {
    root,
    contextFor: (value, fallback): RamlContext => (isObject(value) ? contexts.get(value) : undefined) ?? fallback,
    contextForChild: (parent, key, fallback): RamlContext =>
      (isObject(parent) ? children.get(parent)?.get(key) : undefined) ?? fallback,
    named: (name, context): { value: unknown; context: RamlContext; key: string } => {
      const parts = name.split('.')
      const scope =
        parts.length === 1
          ? (context.scope ?? context)
          : parts.length === 2
            ? context.libraries.get(parts[0]!)
            : undefined
      const key = parts.at(-1)!
      if (!scope || !Object.hasOwn(scope.types, key)) throw new Error('Unresolved RAML type')
      return {
        value: scope.types[key],
        context: children.get(scope.types)?.get(key) ?? scope,
        key: `${scope.uri}#${key}`,
      }
    },
  }
}
