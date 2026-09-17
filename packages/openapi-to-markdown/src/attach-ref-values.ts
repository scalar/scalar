import { SYNTHETIC_BASE, baseAfterId, buildResourceRegistry } from '@amritk/helpers/build-resource-registry'
import { resolveRef } from '@amritk/helpers/resolve-ref'
import { resolveScopedRef } from '@amritk/helpers/resolve-scoped-ref'
import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'
import { getValueByPath } from '@scalar/json-magic/helpers/get-value-by-path'

/**
 * Link references in a private, bundled document without proxies or expanded copies.
 * Non-enumerable links preserve serialization and share recursive schema targets.
 * Returns whether external references remain and require bundling.
 */
export const attachRefValues = (document: unknown): boolean => {
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
      if (target !== undefined) {
        Object.defineProperty(node, '$ref-value', {
          value: target,
          enumerable: false,
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
