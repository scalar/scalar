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
  SchemaObjectSchema,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { type KindPosition, getChildKind, referenceTargetSchemas } from './object-kinds'
import { type SchemaPosition, getChildPosition, restoreBooleanSchemas } from './restore-boolean-schemas'

type AttachRefValuesOptions = {
  /** Report external references without linking anything. */
  detectOnly?: boolean
  /** Resolve targets that are missing from the document, such as values coercion dropped. */
  fallback?: {
    /** The uncoerced source document. */
    source: unknown
    /** Keep boolean schemas, which OpenAPI 3.1 introduced, instead of casting them to objects. */
    booleanSchemas: boolean
  }
}

type ResolvedTarget = {
  value: unknown
  /** The base of the resource that contains the target. */
  context: string
  /** Whether the target is part of the walked document rather than the fallback source. */
  linked: boolean
}

/**
 * Link references in a private, bundled document without proxies or expanded copies.
 * JSON Magic owns `$id` and anchor indexing, which keeps local-reference behavior
 * aligned with the external-reference bundler without retaining a second resolver.
 * Non-enumerable links preserve serialization and share recursive schema targets.
 * With `detectOnly`, nothing is linked and the pass only looks for external references.
 * Returns whether external references remain and require bundling.
 */
const attachRefValues = (
  document: unknown,
  schemas = getSchemas(document),
  { detectOnly = false, fallback }: AttachRefValuesOptions = {},
): boolean => {
  // Fallback targets are linked outside the walked tree and can be reached again from it,
  // so one set keeps every object to a single visit.
  const seen = new WeakSet<object>()
  // Large descriptions repeat the same reference strings thousands of times.
  const targets = new Map<string, ResolvedTarget | undefined>()
  // Share one cast copy between every reference of the same kind to the same dropped target.
  const castFallbacks = new WeakMap<object, Map<unknown, unknown>>()
  let hasExternalReferences = false

  const lookUp = (path: string, ref: string): ResolvedTarget => {
    // An empty path is a resource root, unless the fragment is the pointer to the empty key.
    const segments = path === '' && !ref.includes('#/') ? [] : parseJsonPointerSegments(`/${path}`)
    const linked = getValueByPath(document, segments)
    if (linked.value !== undefined || fallback === undefined) {
      return { ...linked, linked: true }
    }
    // The context is the base of the resource that contains the fallback target.
    return { ...getValueByPath(fallback.source, segments), linked: false }
  }

  const resolve = (ref: string, base: string): ResolvedTarget | undefined => {
    const key = `${base}\u0000${ref}`
    if (targets.has(key)) {
      return targets.get(key)
    }

    // JSON Magic has no entry for an empty fragment, which names the root of the current resource.
    const path = ref === '#' ? (schemas.get(base) ?? '') : convertToLocalRef(ref, base, schemas)
    const resolved = path === undefined ? undefined : lookUp(path, ref)

    targets.set(key, resolved)
    return resolved
  }

  // Cast dropped targets like the objects they stand in for, so the renderer never sees uncoerced shapes.
  const castFallback = (
    value: unknown,
    schema: Parameters<typeof coerceValue>[0],
    position: SchemaPosition,
  ): unknown => {
    // OpenAPI 3.1 keeps boolean schemas, and a nested reference is linked once it is walked.
    if (
      value === undefined ||
      (fallback?.booleanSchemas && position === 'schema' && typeof value === 'boolean') ||
      (isObject(value) && typeof value.$ref === 'string')
    ) {
      return value
    }
    if (!isObject(value)) {
      return coerceValue(schema, value)
    }
    const casts = castFallbacks.get(value) ?? new Map<unknown, unknown>()
    castFallbacks.set(value, casts)
    if (!casts.has(schema)) {
      const cast = coerceValue(schema, value)
      if (fallback?.booleanSchemas) {
        restoreBooleanSchemas(value, cast, position)
      }
      casts.set(schema, cast)
    }
    return casts.get(schema)
  }

  // Schemas are recognized by their position, and every other object by the field that holds it.
  const getTargetSchema = (
    position: SchemaPosition | undefined,
    kind: KindPosition | undefined,
  ): Parameters<typeof coerceValue>[0] | undefined => {
    if (position === 'schema') {
      return SchemaObjectSchema
    }
    return typeof kind === 'string' ? referenceTargetSchemas[kind] : undefined
  }

  const visit = (
    node: unknown,
    context: string,
    position: SchemaPosition | undefined,
    kind: KindPosition | undefined,
  ): void => {
    if (node === null || typeof node !== 'object' || seen.has(node)) {
      return
    }
    seen.add(node)

    // Nested `$id` values redefine the base for relative references and anchors.
    const base = getId(node) ?? context

    if (isObject(node) && typeof node.$ref === 'string') {
      const ref = node.$ref

      if (detectOnly) {
        // JSON Magic only needs to bundle references outside this document's resource index.
        if (ref.split('#')[0] && convertToLocalRef(ref, base, schemas) === undefined) {
          hasExternalReferences = true
        }
      } else {
        const resolved = resolve(ref, base)
        const schema = resolved && !resolved.linked ? getTargetSchema(position, kind) : undefined
        // Point to the target instead of copying it into every reference.
        const target = schema ? castFallback(resolved?.value, schema, position ?? 'document') : resolved?.value

        if (target !== undefined) {
          Object.defineProperty(node, '$ref-value', {
            value: target,
            enumerable: false,
            configurable: true,
            writable: true,
          })
        }
        // Fallback targets live outside the walked tree, so link their own references too.
        if (resolved && !resolved.linked) {
          visit(target, resolved.context, position, kind)
        }
      }
    }

    // Preserve the nearest resource base while walking into child schemas.
    for (const [key, child] of Object.entries(node)) {
      visit(
        child,
        base,
        Array.isArray(node) ? position : position && getChildPosition(position, key),
        kind && getChildKind(kind, key),
      )
    }
  }
  visit(document, getId(document) ?? '', 'document', 'document')
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
  const booleanSchemas = /^3\.[12]\./.test(declaredOpenapiVersion)
  if (booleanSchemas) {
    restoreBooleanSchemas(document, coerced)
  }

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

  // Link references to coerced targets. Targets that coercion dropped fall back to source values,
  // which are cast in schema positions.
  attachRefValues(coerced, schemas, { fallback: { source: document, booleanSchemas } })

  return coerced
}
