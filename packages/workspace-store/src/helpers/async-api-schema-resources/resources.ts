import { isObject } from '@scalar/helpers/object/is-object'
import type { LoaderPlugin } from '@scalar/json-magic/bundle'

import { protobufImports } from './protobuf-imports'
import { RamlInclude, type RamlPosition, parseRamlSource, ramlChildPosition } from './raml-source'
import { schemaResourcePath } from './schema-resource-path'

/** Raw dependencies travel with a schema across server chunks, without changing its authored source. */
export type AsyncApiSchemaResources = { origin: string; files: Record<string, string>; failed?: true; deferred?: true }

/** Record the containing file without downloading native dependencies during browser ingestion. */
export const deferSchemaResources = (format: string, origin: string): AsyncApiSchemaResources | undefined =>
  nativeSchemaLanguage(format) ? { origin, files: {}, deferred: true } : undefined

const nativeSchemaLanguage = (format: string): 'raml' | 'proto' | undefined => {
  const normalized = format
    .toLowerCase()
    .split(';')
    .map((part) => part.trim())
    .join(';')
  if (/^application\/raml\+yaml;version\s*=\s*(?:"1\.0"|1\.0)$/.test(normalized)) return 'raml'
  if (/^application\/vnd\.google\.protobuf;version\s*=\s*(?:"[23]"|[23])$/.test(normalized)) return 'proto'
  return undefined
}

/** Bound both individual graphs and their shared downloads within one ingestion. */
export const createSchemaResourceLoader = (): ((
  format: string,
  source: unknown,
  origin: string,
  loaders: LoaderPlugin[],
) => Promise<AsyncApiSchemaResources | undefined>) => {
  const cache = new Map<string, Promise<string>>()
  const parsedRamlFiles = new Map<string, unknown>()
  const ingestion = { size: 0 }
  return async (format, source, origin, loaders): Promise<AsyncApiSchemaResources | undefined> => {
    const language = nativeSchemaLanguage(format)
    if (!language) return undefined
    const proto = language === 'proto'
    const files: Record<string, string> = {}
    const state = { size: typeof source === 'string' ? source.length : 0, nodes: 0 }
    const done = new Set<string>()
    const active = new Set<string>()
    const load = async (
      reference: string,
      base: string,
      depth: number,
      position: RamlPosition = 'schema',
    ): Promise<void> => {
      if (depth >= 20) throw new Error('Dependency graph is too deep')
      const url = schemaResourcePath(base, reference)
      const identity = `${position}:${url}`
      if (active.has(identity)) throw new Error('Cyclic schema dependencies')
      if (done.has(identity)) return
      if (!Object.hasOwn(files, url) && Object.keys(files).length >= 64) throw new Error('Too many schema dependencies')
      active.add(identity)
      if (!cache.has(url)) {
        if (cache.size >= 64 || ingestion.size >= 1_000_000) throw new Error('Too many document dependencies')
        const loader = loaders.find((candidate) => candidate.validate(url))
        if (!loader) throw new Error('No resource loader')
        cache.set(
          url,
          (async (): Promise<string> => {
            const result = await loader.exec(url, { parseAs: 'text' })
            if (!result.ok || typeof result.raw !== 'string' || result.raw.length > 200_000)
              throw new Error('Unavailable schema dependency')
            ingestion.size += result.raw.length
            if (ingestion.size > 1_000_000) throw new Error('Document dependencies are too large')
            return result.raw
          })(),
        )
      }
      const text = await cache.get(url)!
      if (!Object.hasOwn(files, url)) state.size += text.length
      if (state.size > 1_000_000) throw new Error('Schema dependencies are too large')
      Object.defineProperty(files, url, { value: text, enumerable: true })
      await scan(text, url, depth + 1, position)
      active.delete(identity)
      done.add(identity)
    }
    const scan = async (
      value: unknown,
      base: string,
      depth: number,
      position: RamlPosition = 'schema',
    ): Promise<void> => {
      if (position === 'text') return
      if (depth > 40 || ++state.nodes > 10_000) throw new Error('Schema is too large')
      if (proto) {
        if (typeof value !== 'string') throw new Error('Expected Protobuf source')
        for (const dependency of protobufImports(value)) await load(dependency.path, base, depth)
        return
      }
      // Inline schemas can share an origin but have different source; only external files have stable URI identity.
      if (typeof value === 'string' && depth > 0 && !parsedRamlFiles.has(base))
        parsedRamlFiles.set(base, parseRamlSource(value))
      const parsed =
        typeof value === 'string' ? (depth > 0 ? parsedRamlFiles.get(base) : parseRamlSource(value)) : value
      if (
        depth > 0 &&
        position === 'schema' &&
        isObject(parsed) &&
        'uses' in parsed &&
        !(typeof value === 'string' && /^#%RAML 1\.0 (?:DataType|Library)[ \t]*(?:\r?\n|$)/.test(value))
      )
        throw new Error('Only typed RAML fragments can declare libraries')
      const seen = new Set<unknown>()
      const library = typeof value === 'string' && /^#%RAML 1\.0 Library/.test(value)
      const walk = async (node: unknown, level: number, position: RamlPosition): Promise<void> => {
        if (level > 40 || ++state.nodes > 10_000) throw new Error('RAML is too large')
        if (node instanceof RamlInclude) {
          await load(node.path, base, depth, position)
        } else if (isObject(node) || Array.isArray(node)) {
          if (seen.has(node)) throw new Error('Cyclic RAML YAML aliases')
          seen.add(node)
          for (const [key, child] of Object.entries(node)) {
            if (node === parsed && position === 'schema' && key === 'uses' && isObject(child)) {
              for (const path of Object.values(child)) {
                if (typeof path !== 'string') throw new Error('Invalid RAML library path')
                await load(path, base, depth)
              }
            } else {
              const next = ramlChildPosition(
                library && node === parsed && position === 'schema' ? 'library' : position,
                key,
              )
              await walk(child, level + 1, next)
            }
          }
          seen.delete(node)
        }
      }
      await walk(parsed, 0, position)
    }
    try {
      if (state.size > 200_000) throw new Error('Schema is too large')
      await scan(source, origin, 0)
      return { origin, files }
    } catch {
      return { origin, files: {}, failed: true }
    }
  }
}
