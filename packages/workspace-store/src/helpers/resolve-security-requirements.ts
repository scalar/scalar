import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { isObject } from '@scalar/helpers/object/is-object'
import { isPollutionKey } from '@scalar/helpers/object/prevent-pollution'
import { isSchemaPath } from '@scalar/helpers/openapi/is-schema-path'
import { type LoaderPlugin, bundle, resolveReferencePath } from '@scalar/json-magic/bundle'
import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { Value } from '@scalar/typebox/value'

import { generateUniqueValue } from '@/helpers/generate-unique-value'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { resolveOpenApiDocument } from '@/plugins/bundler/openapi-document'
import { SecuritySchemeObjectSchema } from '@/schemas/v3.2/strict/openapi-document'

const ALIASES = 'x-scalar-security-uri-aliases'
const ORIGINAL_KEYS = 'x-scalar-original-security-keys'

type SecurityUriOptions = {
  origin?: string
  loaders: LoaderPlugin[]
}

/** Resolve the URI portion separately so filesystem origins do not interpret fragments as filenames. */
const absoluteReference = (reference: string, base: string): string => {
  const separator = reference.indexOf('#')
  const resource = separator === -1 ? reference : reference.slice(0, separator)
  const fragment = separator === -1 ? '' : reference.slice(separator)
  return `${resource ? resolveReferencePath(base, resource) : base}${fragment}`
}

/**
 * Makes URI requirements available to the existing name-based auth consumers.
 * Aliases live only in the working document; export removes them and restores authored keys.
 * Relative keys in referenced documents become absolute to keep distinct document bases apart.
 */
export const resolveSecurityRequirements = async (
  document: Record<string, unknown>,
  { origin = '/', loaders }: SecurityUriOptions,
): Promise<void> => {
  if (typeof document.openapi !== 'string' || !/^3\.2\.\d+$/.test(document.openapi)) return

  const originalKeys = isObject(document[ORIGINAL_KEYS]) ? document[ORIGINAL_KEYS] : {}
  const components = isObject(document.components) ? document.components : {}
  const schemes = isObject(components.securitySchemes) ? components.securitySchemes : {}
  const metadata = isObject(document[ALIASES])
    ? document[ALIASES]
    : {
        hadComponents: isObject(document.components),
        hadSecuritySchemes: isObject(components.securitySchemes),
        schemes: {},
      }
  const aliases = isObject(metadata.schemes) ? metadata.schemes : {}
  metadata.schemes = aliases
  const namedSchemes = new Set(Object.keys(schemes).filter((name) => !Object.hasOwn(aliases, name)))
  const visited = new WeakSet<object>()
  const processedDocuments = new Set<string>()
  const cache = new Map<string, Promise<Awaited<ReturnType<LoaderPlugin['exec']>>>>()

  const visit = async (node: unknown, path: string[], base: string, external: boolean): Promise<void> => {
    if (node === null || typeof node !== 'object' || visited.has(node) || isSchemaPath(path)) return
    visited.add(node)

    // Security is a fixed field on document and operation objects, not arbitrary example payloads.
    const operationKey = path.at(-1) ?? ''
    const isOperation = isHttpMethod(operationKey) || path.at(-2) === 'additionalOperations'
    const isDocument = path.length === 0 || (path[0] === 'x-ext' && path.length === 2)
    if (isObject(node) && (isDocument || isOperation) && Array.isArray(node.security)) {
      for (const [index, requirement] of node.security.entries()) {
        if (!isObject(requirement)) continue
        for (const [name, scopes] of Object.entries(requirement)) {
          if (namedSchemes.has(name) || !Array.isArray(scopes)) continue
          const uri = (() => {
            try {
              return Object.hasOwn(aliases, name) && typeof aliases[name] === 'string'
                ? aliases[name]
                : absoluteReference(name, base)
            } catch {
              return undefined
            }
          })()
          if (uri === undefined) continue
          const key = await generateUniqueValue({
            defaultValue: external ? uri : name,
            validation: (candidate) =>
              !namedSchemes.has(candidate) && (!Object.hasOwn(aliases, candidate) || aliases[candidate] === uri),
            maxRetries: Object.keys(schemes).length + 1,
          })
          if (key === undefined) continue
          if (!Object.hasOwn(aliases, key)) {
            const reference = { $ref: uri }
            await bundle(reference, {
              root: document,
              origin,
              treeShake: false,
              urlMap: true,
              cache,
              plugins: loaders,
              hooks: { resolveDocument: resolveOpenApiDocument },
            })
            // Validate the target before exposing an auth option; missing pointers and non-schemes
            // keep their original requirement and never acquire a misleading working alias.
            const proxy = createMagicProxy(
              { ...document, 'x-scalar-security-uri-target': reference },
              {
                documentUri: resolveOpenApiDocument(document, origin)?.baseUri,
              },
            )
            const target = getResolvedRef(proxy['x-scalar-security-uri-target'])
            if (!Value.Check(SecuritySchemeObjectSchema, target)) continue
            Object.defineProperty(schemes, key, {
              value: reference,
              enumerable: true,
              writable: true,
              configurable: true,
            })
            Object.defineProperty(aliases, key, { value: uri, enumerable: true, writable: true, configurable: true })
            components.securitySchemes = schemes
            document.components = components
            document[ALIASES] = metadata
          }
          if (external) {
            const location = JSON.stringify([...path, 'security', String(index)])
            const mapping = isObject(originalKeys[location]) ? originalKeys[location] : {}
            Object.defineProperty(mapping, name, { value: key, enumerable: true, writable: true, configurable: true })
            originalKeys[location] = mapping
            document[ORIGINAL_KEYS] = originalKeys
            if (key === name) continue
            const previous = Object.hasOwn(requirement, key) ? requirement[key] : []
            Object.defineProperty(requirement, key, {
              value: [...new Set([...(Array.isArray(previous) ? previous : []), ...scopes])],
              enumerable: true,
              writable: true,
              configurable: true,
            })
            delete requirement[name]
          }
        }
      }
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('x-') || key === 'example' || key === 'examples' || key === 'security') continue
      await visit(child, [...path, key], base, external)
    }
  }

  const entryBase = resolveOpenApiDocument(document, origin)?.baseUri ?? origin
  await visit(document, [], entryBase, false)
  // URI-only dependencies can load further documents, so process newly embedded documents too.
  while (isObject(document['x-ext'])) {
    const next = Object.entries(document['x-ext']).find(([key]) => !processedDocuments.has(key))
    if (!next) break
    const [key, external] = next
    processedDocuments.add(key)
    if (!isObject(external)) continue
    if (typeof external.openapi === 'string' && !/^3\.2\.\d+$/.test(external.openapi)) continue
    const mappings = document['x-ext-urls']
    const retrieval = isObject(mappings) && typeof mappings[key] === 'string' ? mappings[key] : key
    const retrievalUri = resolveReferencePath(entryBase, retrieval)
    await visit(external, ['x-ext', key], resolveOpenApiDocument(external, retrievalUri)?.baseUri ?? retrievalUri, true)
  }
}

/** Remove runtime URI aliases while keeping edited scopes and authored requirement spellings. */
export const restoreSecurityRequirements = (document: Record<string, unknown>): void => {
  const originalKeys = document[ORIGINAL_KEYS]
  if (isObject(originalKeys)) {
    for (const [location, mapping] of Object.entries(originalKeys)) {
      const path: unknown = (() => {
        try {
          return JSON.parse(location)
        } catch {
          return undefined
        }
      })()
      if (
        !Array.isArray(path) ||
        !path.every((segment) => typeof segment === 'string' && !isPollutionKey(segment)) ||
        !isObject(mapping)
      )
        continue
      const requirement = getValueAtPath(document, path)
      if (!isObject(requirement)) continue
      const entries = Object.entries(mapping).flatMap(([original, rewritten]) =>
        typeof rewritten === 'string' && Object.hasOwn(requirement, rewritten)
          ? [{ original, rewritten, scopes: requirement[rewritten] }]
          : [],
      )
      for (const { rewritten } of entries) delete requirement[rewritten]
      for (const { original, scopes } of entries) {
        Object.defineProperty(requirement, original, {
          value: scopes,
          enumerable: true,
          writable: true,
          configurable: true,
        })
      }
    }
  }
  const metadata = document[ALIASES]
  const components = document.components
  if (
    isObject(metadata) &&
    isObject(metadata.schemes) &&
    isObject(components) &&
    isObject(components.securitySchemes)
  ) {
    for (const key of Object.keys(metadata.schemes)) delete components.securitySchemes[key]
    if (!metadata.hadSecuritySchemes && Object.keys(components.securitySchemes).length === 0)
      delete components.securitySchemes
    if (!metadata.hadComponents && Object.keys(components).length === 0) delete document.components
  }
  delete document[ALIASES]
  delete document[ORIGINAL_KEYS]
}
