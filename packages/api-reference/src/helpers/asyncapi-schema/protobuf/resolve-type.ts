import { type Definition, isMessage, isScalar } from './ast'

/** Resolve lexically; a local prefix shadows an outer type even when its suffix is missing. */
export const resolveType = (
  scope: Definition,
  name: string,
  parents: WeakMap<Definition, Definition>,
): Definition | null => {
  if (isScalar(name)) {
    return null
  }
  const get = (node: Definition, key: string): Definition | null => {
    // Schema identifiers can match Object.prototype names such as constructor.
    const own = (map: Record<string, Definition> | undefined): Definition | null =>
      map && Object.hasOwn(map, key) ? (map[key] ?? null) : null
    if (isMessage(node)) {
      return own(node.fields) ?? own(node.oneofs) ?? own(node.nested)
    }
    return 'nested' in node ? own(node.nested) : null
  }
  const descend = (node: Definition, parts: string[]): Definition | null =>
    parts.reduce<Definition | null>((parent, part) => (parent ? get(parent, part) : null), node)
  if (name.startsWith('.')) {
    const root = (node: Definition): Definition => {
      const parent = parents.get(node)
      return parent ? root(parent) : node
    }
    return descend(root(scope), name.slice(1).split('.'))
  }
  const [head, ...tail] = name.split('.')
  const find = (node: Definition): Definition | null => {
    const first = head ? get(node, head) : null
    if (first) {
      return descend(first, tail)
    }
    const parent = parents.get(node)
    return parent ? find(parent) : null
  }
  return find(scope)
}
