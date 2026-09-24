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

import { restoreBooleanSchemas } from './restore-boolean-schemas'

type AttachRefValuesOptions = {
  /** Report external references without linking anything. */
  detectOnly?: boolean
  /** Resolve targets that are missing from the document, such as values coercion dropped. */
  fallback?: unknown
}

/**
 * Link references in a private, bundled document without proxies or expanded copies.
 * JSON Magic owns `$id` and anchor indexing, which keeps local-reference behavior
 * aligned with the external-reference bundler without retaining a second resolver.
 * Non-enumerable links preserve serialization and share recursive schema targets.
 * Returns whether external references remain and require bundling.
 */
const attachRefValues = (
  document: unknown,
  schemas = getSchemas(document),
  { detectOnly = false, fallback }: AttachRefValuesOptions = {},
): boolean => {
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

      // JSON Magic only needs to bundle references outside this document's resource index.
      if (path === undefined && ref.split('#')[0]) {
        hasExternalReferences = true
      }

      if (!detectOnly && path !== undefined) {
        const segments = parseJsonPointerSegments(`/${path}`)
        const linked = getValueByPath(document, segments).value
        // Point to the bundled target instead of copying it into every reference.
        const target =
          linked === undefined && fallback !== undefined ? getValueByPath(fallback, segments).value : linked

        if (target !== undefined) {
          Object.defineProperty(node, '$ref-value', {
            value: target,
            enumerable: false,
            configurable: true,
            writable: true,
          })
        }
        // Fallback targets live outside the walked tree, so link their own references too.
        if (linked === undefined) {
          visit(target, base)
        }
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

/** Coerce one plain document and keep references linked to shared targets. */
export const loadDocument = async (
  input: OpenApiDocument | Record<string, unknown> | string,
): Promise<OpenApiDocument> => {
  let raw: unknown
  let origin: string | undefined

  // Reference links are attached below, so never mutate the caller's document.
  if (typeof input !== 'string') {
    raw = deepClone(getRaw(input))
  }

  // Inline JSON and YAML avoid the I/O path; URLs and files are loaded afterward.
  else {
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

  // Upgrade before indexing so reference resolution sees one consistent dialect.
  const declaredOpenapiVersion = typeof raw.openapi === 'string' ? raw.openapi : '2.0'
  const { document: upgraded } = upgrade(raw, '3.2', { onIncompatible: 'collect' })
  const upgradedSchemas = getSchemas(upgraded)
  const hasExternalReferences = attachRefValues(upgraded, upgradedSchemas, { detectOnly: true })

  let document = upgraded
  let schemas = upgradedSchemas

  // Resolve external targets only when the initial local-reference pass finds them.
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
    schemas = getSchemas(document)
  }

  // Cast the document before linking references. TypeBox clones every value that already
  // matches a union or array schema, and its clone follows all own properties, including
  // non-enumerable `$ref-value` links. On densely linked descriptions, each clone would copy
  // most of the reference graph again, which costs gigabytes of transient memory.
  // Reference branches accept a missing `$ref-value`, and every target is cast in its own
  // position, so one target that fails a strict check can no longer replace the reference.
  const coerced = coerceValue(OpenAPIDocumentSchema, document)
  // Rendering must use the declared version for features added after OpenAPI 3.1.
  coerced['x-original-oas-version'] = declaredOpenapiVersion

  // Boolean schemas were introduced in OpenAPI 3.1; older descriptions retain their existing coercion.
  if (/^3\.[12]\./.test(declaredOpenapiVersion)) restoreBooleanSchemas(document, coerced)

  // Keep extension resources that local and bundled references can target.
  for (const [key, value] of Object.entries(document)) {
    if (key.startsWith('x-') && !(key in coerced)) {
      Object.defineProperty(coerced, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true,
      })
    }
  }

  // Link references to coerced targets, falling back to source values that coercion dropped.
  attachRefValues(coerced, schemas, { fallback: document })

  return coerced
}
