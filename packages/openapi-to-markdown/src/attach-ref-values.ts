import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'
import { getValueByPath } from '@scalar/json-magic/helpers/get-value-by-path'

/**
 * Link references in a private, bundled document without proxies or expanded copies.
 * Non-enumerable links preserve serialization and share recursive schema targets.
 * Returns whether external references remain and require bundling.
 */
export const attachRefValues = (document: unknown): boolean => {
  const references: Array<{ node: Record<string, unknown>; resource: unknown; id: string }> = []
  const resources = new Map<string, unknown>()
  const seen = new WeakSet<object>()
  const visit = (node: unknown, resource: unknown, id: string): void => {
    if (node === null || typeof node !== 'object' || seen.has(node)) return
    seen.add(node)
    if (isObject(node)) {
      if (typeof node.$id === 'string') {
        id = node.$id
        resource = node
        resources.set(id, node)
      }
      if (typeof node.$anchor === 'string') resources.set(`${id}#${node.$anchor}`, node)
      if (typeof node.$ref === 'string') references.push({ node, resource, id })
    }
    for (const child of Object.values(node)) visit(child, resource, id)
  }
  visit(document, document, '')
  let hasExternalReferences = false
  for (const { node, resource, id } of references) {
    const ref = String(node.$ref)
    const hash = ref.indexOf('#')
    const base = hash < 0 ? ref : ref.slice(0, hash)
    const fragment = hash < 0 ? '' : ref.slice(hash + 1)
    if (base && !resources.has(base)) hasExternalReferences = true
    const root = base ? resources.get(base) : resource
    const target = !fragment
      ? root
      : fragment.startsWith('/')
        ? getValueByPath(root, parseJsonPointerSegments(fragment)).value
        : resources.get(`${base || id}#${fragment}`)
    if (target !== undefined) {
      Object.defineProperty(node, '$ref-value', {
        value: target,
        enumerable: false,
        configurable: true,
        writable: true,
      })
    }
  }
  return hasExternalReferences
}
