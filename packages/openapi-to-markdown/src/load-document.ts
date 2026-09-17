import { SYNTHETIC_BASE, baseAfterId, buildResourceRegistry } from '@amritk/helpers/build-resource-registry'
import { resolveRef } from '@amritk/helpers/resolve-ref'
import { resolveScopedRef } from '@amritk/helpers/resolve-scoped-ref'
import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'
import { bundle } from '@scalar/json-magic/bundle'
import { getValueByPath } from '@scalar/json-magic/helpers/get-value-by-path'
import { normalize } from '@scalar/json-magic/helpers/normalize'
import { getRaw } from '@scalar/json-magic/magic-proxy'
import { upgrade } from '@scalar/openapi-upgrader'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  OpenAPIDocumentSchema,
  type OpenApiDocument,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/**
 * Link references in a private, bundled document without proxies or expanded copies.
 * Non-enumerable links preserve serialization and share recursive schema targets.
 * Casting temporarily uses enumerable links to satisfy TypeBox reference branches.
 * Returns whether external references remain and require bundling.
 */
const attachRefValues = (document: unknown, enumerable = false): boolean => {
  const registry = buildResourceRegistry(document)
  const seen = new WeakSet<object>()
  let hasExternalReferences = false
  const visit = (node: unknown, enclosing: string): void => {
    if (node === null || typeof node !== 'object' || seen.has(node)) {
      return
    }
    seen.add(node)
    const base = isObject(node) ? baseAfterId(node, enclosing) : enclosing
    if (isObject(node) && typeof node.$ref === 'string') {
      const ref = node.$ref
      const resource = ref.split('#')[0] ?? ''
      if (resource && (!registry || !resolveScopedRef(registry, resource, base))) {
        hasExternalReferences = true
      }
      // A registry is only needed for documents with embedded $id resources.
      const localPointer = ref.startsWith('#/') || ref === '#' ? ref.slice(1) : undefined
      const pointer = registry ? resolveScopedRef(registry, ref, base)?.pointer : localPointer
      let target: unknown
      if (pointer !== undefined) {
        target = getValueByPath(document, parseJsonPointerSegments(pointer)).value
      } else if (!registry && ref.startsWith('#') && isObject(document)) {
        target = resolveRef(ref, document)
      }
      if (enumerable) {
        const followed = new WeakSet<object>()
        while (isObject(target) && '$ref-value' in target && !followed.has(target)) {
          followed.add(target)
          target = target['$ref-value']
        }
      }
      if (target !== undefined) {
        Object.defineProperty(node, '$ref-value', {
          value: target,
          enumerable,
          configurable: true,
          writable: true,
        })
      }
    }
    for (const child of Object.values(node)) {
      visit(child, base)
    }
  }
  visit(document, SYNTHETIC_BASE)
  return hasExternalReferences
}

/** Remove cast-time reference links before rebuilding them against the coerced graph. */
const removeRefValues = (document: unknown): void => {
  const seen = new WeakSet<object>()
  const visit = (node: unknown): void => {
    if (node === null || typeof node !== 'object' || seen.has(node)) {
      return
    }
    seen.add(node)
    if (isObject(node) && '$ref-value' in node) {
      delete node['$ref-value']
    }
    for (const child of Object.values(node)) {
      visit(child)
    }
  }
  visit(document)
}

/** Coerce one plain document and keep references linked to shared targets. */
export const loadDocument = async (
  input: OpenApiDocument | Record<string, unknown> | string,
): Promise<OpenApiDocument> => {
  let raw: unknown
  let origin: string | undefined
  if (typeof input !== 'string') {
    raw = deepClone(getRaw(input))
  } else {
    const normalized = normalize(input)
    if (isObject(normalized)) {
      raw = normalized
    } else if (/^https?:\/\//i.test(input)) {
      const response = await fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to load OpenAPI document (HTTP ${response.status})`)
      }
      raw = normalize(await response.text())
      origin = input
    } else {
      const [{ resolve }, { readFile }] = await Promise.all([import('node:path'), import('node:fs/promises')])
      origin = resolve(input)
      raw = normalize(await readFile(origin, 'utf8'))
    }
  }
  if (!isObject(raw)) {
    throw new Error('Failed to load OpenAPI document')
  }
  const upgraded = upgrade(raw, '3.1')
  const hasExternalReferences = attachRefValues(upgraded)
  let document = upgraded
  if (hasExternalReferences) {
    const errors: string[] = []
    const plugins =
      typeof process === 'undefined'
        ? [(await import('@scalar/json-magic/bundle/plugins/browser')).fetchUrls()]
        : [
            (await import('@scalar/json-magic/bundle/plugins/node')).fetchUrls(),
            (await import('@scalar/json-magic/bundle/plugins/node')).readFiles(),
          ]
    document = await bundle(upgraded, {
      plugins,
      origin,
      treeShake: false,
      hooks: { onResolveError: (node) => errors.push(`Failed to resolve ${node.$ref}`) },
    })
    if (errors.length) {
      throw new Error(errors.join('\n'))
    }
  }
  attachRefValues(document)
  // TypeBox's reference branches require an enumerable $ref-value during casting.
  // Restore non-enumerable shared links afterward so rendering never expands the graph.
  attachRefValues(document, true)
  const coerced = coerceValue(OpenAPIDocumentSchema, document)
  // Keep extension resources that local and bundled references can target.
  const extensions = coerced as Record<string, unknown>
  for (const [key, value] of Object.entries(document)) {
    if (key.startsWith('x-') && !(key in extensions)) {
      extensions[key] = value
    }
  }
  removeRefValues(coerced)
  attachRefValues(coerced)
  return coerced as OpenApiDocument
}
