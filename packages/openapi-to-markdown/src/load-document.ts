import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'
import { bundle } from '@scalar/json-magic/bundle'
import { convertToLocalRef } from '@scalar/json-magic/helpers/convert-to-local-ref'
import { getId, getSchemas } from '@scalar/json-magic/helpers/get-schemas'
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

/** Limit cycle tracking to the active branch while indexing this private cloned document. */
const getDocumentSchemas = (document: unknown): Map<string, string> =>
  getSchemas(document, '', [], new Map(), new WeakSet(), true)

/**
 * Link references in a private, bundled document without proxies or expanded copies.
 * JSON Magic owns `$id` and anchor indexing, which keeps local-reference behavior
 * aligned with the external-reference bundler without retaining a second resolver.
 * Non-enumerable links preserve serialization and share recursive schema targets.
 * Casting temporarily uses enumerable links to satisfy TypeBox reference branches.
 * Returns whether external references remain and require bundling.
 */
const attachRefValues = (document: unknown, enumerable = false, schemas = getDocumentSchemas(document)): boolean => {
  // A single traversal covers both normal trees and previously linked recursive objects.
  const seen = new WeakSet<object>()
  let hasExternalReferences = false
  const visit = (node: unknown, context = getId(document) ?? ''): void => {
    if (node === null || typeof node !== 'object' || seen.has(node)) {
      return
    }
    seen.add(node)
    // Nested `$id` values redefine the base for relative references and anchors.
    const base = getId(node) ?? context
    if (isObject(node) && typeof node.$ref === 'string') {
      const ref = node.$ref
      const path = ref === '#' ? '' : convertToLocalRef(ref, base, schemas)
      // Point to the bundled target instead of copying it into every reference.
      const target =
        path === undefined ? undefined : getValueByPath(document, parseJsonPointerSegments(`/${path}`)).value
      // JSON Magic only needs to bundle references outside this document's resource index.
      if (path === undefined && ref.split('#')[0]) hasExternalReferences = true
      if (enumerable) {
        const followed = new WeakSet<object>()
        let resolved = target
        // TypeBox needs the final target, so collapse a pre-existing reference chain safely.
        while (isObject(resolved) && '$ref-value' in resolved && !followed.has(resolved)) {
          followed.add(resolved)
          resolved = resolved['$ref-value']
        }
        if (resolved !== undefined) {
          Object.defineProperty(node, '$ref-value', {
            value: resolved,
            enumerable,
            configurable: true,
            writable: true,
          })
        }
      } else if (target !== undefined) {
        Object.defineProperty(node, '$ref-value', {
          value: target,
          enumerable,
          configurable: true,
          writable: true,
        })
      }
    }
    // Preserve the nearest resource base while walking into child schemas.
    for (const child of Object.values(node)) {
      visit(child, base)
    }
  }
  visit(document)
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
  const upgradedSchemas = getDocumentSchemas(upgraded)
  const hasExternalReferences = attachRefValues(upgraded, false, upgradedSchemas)
  let document = upgraded
  let schemas = upgradedSchemas
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
    schemas = getDocumentSchemas(document)
    attachRefValues(document, false, schemas)
  }
  // TypeBox's reference branches require an enumerable $ref-value during casting.
  // Restore non-enumerable shared links afterward so rendering never expands the graph.
  attachRefValues(document, true, schemas)
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
