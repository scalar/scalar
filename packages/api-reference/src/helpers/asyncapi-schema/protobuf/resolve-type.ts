import protobuf from 'protobufjs'

/** Resolve lexically, without protobufjs lookup's root-first shortcut or descendant search. */
export const resolveType = (scope: protobuf.Namespace, name: string): protobuf.ReflectionObject | null => {
  if (Object.hasOwn(protobuf.types.basic, name)) {
    return null
  }
  const descend = (object: protobuf.ReflectionObject | null, parts: string[]): protobuf.ReflectionObject | null =>
    parts.reduce<protobuf.ReflectionObject | null>(
      (parent, part) => (parent instanceof protobuf.Namespace ? parent.get(part) : null),
      object,
    )
  if (name.startsWith('.')) {
    return descend(scope.root, name.slice(1).split('.'))
  }
  const [head, ...tail] = name.split('.')
  const find = (namespace: protobuf.Namespace): protobuf.ReflectionObject | null => {
    const first = head ? namespace.get(head) : null
    // Once a prefix is found in an inner scope, a missing suffix must not select an outer type.
    if (first) {
      return descend(first, tail)
    }
    return namespace.parent instanceof protobuf.Namespace ? find(namespace.parent) : null
  }
  return find(scope)
}
