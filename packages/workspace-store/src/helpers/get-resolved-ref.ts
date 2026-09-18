import { isObject } from '@scalar/helpers/object/is-object'

export type RefNode<Node> = Partial<Node> & { $ref: string; '$ref-value'?: Node }
export type NodeInput<Node> = Node | RefNode<Node>

/**
 * Keys the store writes on an externalized stub for its own bookkeeping.
 *
 * They describe the stub — whether it is shared across documents, whether its chunk has loaded — not the
 * node it points at.
 */
const STUB_BOOKKEEPING_KEYS = new Set(['$global', '$status'])

const isReferenceNode = (value: unknown): value is RefNode<unknown> =>
  typeof value === 'object' && value !== null && '$ref' in value

/**
 * Whether a reference is pure indirection: a `$ref` and the store's own bookkeeping, nothing more.
 *
 * A reference that carries anything else is a schema in its own right — an `$id` opens a schema
 * resource, `$defs` and `$dynamicAnchor` bind a generic's type parameter, and `description` annotates
 * the target — so it stays its own hop and the caller resolves it as it descends, the way it always
 * has. Collapsing such a node into the one it points at merges two schema resources into one, and the
 * `$dynamicRef` in the inner one then has no outer scope left to bind against.
 */
const isPassThroughReference = (node: RefNode<unknown>): boolean => {
  for (const key of Object.keys(node)) {
    if (key !== '$ref' && key !== '$ref-value' && !STUB_BOOKKEEPING_KEYS.has(key)) {
      return false
    }
  }

  return true
}

/**
 * Follow `$ref-value` onward for as long as it lands on another reference that is pure indirection.
 *
 * A reference can point at a second reference. `resolve()` on a static or SSR workspace leaves exactly
 * that behind: the component stays in the document as a `{ $ref: '#/x-ext/<hash>', $global: true }` stub
 * and the content lives under `x-ext`, so `#/components/schemas/User` reaches the schema in two hops.
 * Stopping at the first hop hands consumers the stub, a node with no `type` and no `properties`, which
 * renders as an empty, non-expandable schema.
 *
 * Stops at a reference that has not been resolved yet and hands that node back, which is what a single
 * hop onto an unresolved reference produces today. `seen` terminates a reference cycle on the node it
 * comes back around to rather than looping.
 *
 * @param value - The value the first hop produced.
 * @param seen - References already crossed, including the node the chain started at.
 */
const followPassThroughReferences = (value: unknown, seen: Set<unknown>): unknown => {
  let current = value

  while (isReferenceNode(current) && isPassThroughReference(current) && !seen.has(current)) {
    const next = current['$ref-value']
    if (next === undefined) {
      return current
    }

    seen.add(current)
    current = next
  }

  return current
}

const defaultTransform = <Node>(node: RefNode<Node>) => {
  // Unresolved references have no value; callers must account for that state.
  const value = node['$ref-value']
  if (value === undefined) {
    return undefined
  }

  return followPassThroughReferences(value, new Set([node])) as Node
}

/**
 * Transform for getResolvedRef that merges sibling properties of a $ref wrapper
 * onto the dereferenced value. Wrapper siblings take precedence over the resolved value,
 * which matches OpenAPI 3.1 semantics where annotations alongside $ref override the target.
 */
export const mergeSiblingReferences = <Node>(node: RefNode<Node>): Node => {
  const { '$ref-value': value, ...rest } = node
  const target = value === undefined ? undefined : followPassThroughReferences(value, new Set([node]))

  // A reference can land on something that is not a record: a pointer that aims at a string
  // (`$ref: '#/info/title'`), one that was never resolved, or one whose target is an array. Spreading
  // any of those copies it index by index, so a reference to a title becomes `{ 0: 'G', 1: 'a', … }`
  // and every consumer downstream treats those digits as real properties. There is nothing to merge
  // siblings onto in that case, so only the siblings survive.
  if (!isObject(target)) {
    return rest as Node
  }

  const merged = { ...target, ...rest }

  // Plain document loaders hide reference links from serialization. Preserve the
  // next hop explicitly so chain resolution does not depend on object spread.
  if ('$ref-value' in target && !Object.hasOwn(merged, '$ref-value')) {
    Object.defineProperty(merged, '$ref-value', {
      value: target['$ref-value'],
      enumerable: false,
      configurable: true,
      writable: true,
    })
  }

  return merged as Node
}

/**
 * Resolves a node that may be a $ref object to its actual value.
 * If the node contains a $ref, applies the provided transform (default: returns '$ref-value').
 * Otherwise, returns the node as-is.
 */
export function getResolvedRef<Node, Result>(
  node: NodeInput<Node>,
  transform: (node: RefNode<Node>) => Result,
): Node | Result
export function getResolvedRef<Node>(node: { $ref: string; '$ref-value': Node }): Node
export function getResolvedRef<Node>(node: NodeInput<Node>): Node | undefined
export function getResolvedRef<Node, Result>(
  node: NodeInput<Node>,
  transform: (node: RefNode<Node>) => Result | Node | undefined = defaultTransform,
): Node | Result | undefined {
  if (typeof node === 'object' && node !== null && '$ref' in node) {
    return transform(node)
  }
  return node
}

/**
 * Type helper we can use if we have getResolvedRef higher in the stack
 */
export type Dereference<T> = T extends { $ref: string; '$ref-value'?: infer V } ? (V extends object ? V : never) : T
