import { isObject } from '@scalar/helpers/object/is-object'
import { RamlInclude, parseRamlSource } from '@scalar/workspace-store/helpers/async-api-schema-resources/raml-source'
import type { AsyncApiSchemaResources } from '@scalar/workspace-store/helpers/async-api-schema-resources/resources'
import { schemaResourcePath } from '@scalar/workspace-store/helpers/async-api-schema-resources/schema-resource-path'

/** Each fragment owns its uses aliases; library aliases cannot be chained across files. */
export type RamlContext = {
  value: unknown
  uri: string
  types: Record<string, unknown>
  libraries: Map<string, RamlContext>
}

/** Keep fragment and library scopes separate, even when two libraries define the same short name. */
export const ramlDependencies = (
  source: unknown,
  resources?: AsyncApiSchemaResources,
): {
  root: RamlContext
  include: (value: RamlInclude, context: RamlContext) => RamlContext
  text: (value: RamlInclude, context: RamlContext) => string
  named: (name: string, context: RamlContext) => { value: unknown; context: RamlContext; key: string }
} => {
  const cache = new Map<string, RamlContext>()
  const active = new Set<string>()
  const state = { size: typeof source === 'string' ? source.length : 0 }
  const text = (value: RamlInclude, context: RamlContext): string => {
    const uri = schemaResourcePath(context.uri, value.path)
    const content = resources && Object.hasOwn(resources.files, uri) ? resources.files[uri] : undefined
    if (typeof content !== 'string' || content.length > 200_000) throw new Error('Missing RAML dependency')
    return content
  }
  const create = (source: unknown, uri: string, library: boolean, depth: number): RamlContext => {
    if (depth > 20 || active.has(uri) || cache.size > 64 || state.size > 1_000_000)
      throw new Error('Invalid RAML dependency graph')
    const cached = cache.get(uri)
    if (cached) return cached
    active.add(uri)
    if (
      typeof source === 'string' &&
      /^#%RAML/m.test(source) &&
      !(library ? /^#%RAML 1\.0 Library[ \t]*(?:\r?\n|$)/ : /^#%RAML 1\.0 DataType[ \t]*(?:\r?\n|$)/).test(source)
    )
      throw new Error('Unsupported RAML fragment')
    if (library && (typeof source !== 'string' || !/^#%RAML 1\.0 Library[ \t]*(?:\r?\n|$)/.test(source)))
      throw new Error('Expected RAML library')
    const value = typeof source === 'string' ? parseRamlSource(source) : source
    const object = isObject(value) ? value : {}
    if (library && Object.keys(object).some((key) => !['uses', 'types', 'usage', 'description'].includes(key)))
      throw new Error('Unsupported RAML library declarations')
    if ('uses' in object && !isObject(object.uses)) throw new Error('Invalid RAML uses')
    if (library && object.types !== undefined && !isObject(object.types)) throw new Error('Invalid RAML types')
    const context: RamlContext = {
      value,
      uri,
      types: library && isObject(object.types) ? object.types : {},
      libraries: new Map(),
    }
    cache.set(uri, context)
    for (const [alias, path] of Object.entries(isObject(object.uses) ? object.uses : {})) {
      if (!/^[A-Za-z_][A-Za-z_0-9-]*$/.test(alias) || typeof path !== 'string')
        throw new Error('Invalid RAML library alias')
      const target = schemaResourcePath(uri, path)
      const content = text(new RamlInclude(path), context)
      if (!cache.has(target)) state.size += content.length
      context.libraries.set(alias, create(content, target, true, depth + 1))
    }
    active.delete(uri)
    return context
  }
  const root = create(source, resources?.origin ?? '', false, 0)
  return {
    root,
    text,
    include: (value, context): RamlContext => {
      const uri = schemaResourcePath(context.uri, value.path)
      const content = text(value, context)
      if (!cache.has(uri)) state.size += content.length
      return create(content, uri, false, 1)
    },
    named: (name, context): { value: unknown; context: RamlContext; key: string } => {
      const parts = name.split('.')
      const scope = parts.length === 1 ? context : parts.length === 2 ? context.libraries.get(parts[0]!) : undefined
      const key = parts.at(-1)!
      if (!scope || !Object.hasOwn(scope.types, key)) throw new Error('Unresolved RAML type')
      return { value: scope.types[key], context: scope, key: `${scope.uri}#${key}` }
    },
  }
}
