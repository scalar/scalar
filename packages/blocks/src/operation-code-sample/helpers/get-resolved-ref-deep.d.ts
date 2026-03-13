import { type Dereference } from '@scalar/workspace-store/helpers/get-resolved-ref'
type RefNode<Node> = Partial<Node> & {
  $ref: string
  '$ref-value': Node | RefNode<Node>
}
type NodeInput<Node> = Node | RefNode<Node>
/**
 * Recursively resolves $ref objects
 * This type helper ensures proper typing for deeply nested ref resolution.
 * Properties that could contain $ref objects may resolve to '[circular]' if we have a circular reference.
 */
type DeepDereference<T> = Dereference<T> extends T
  ? T extends readonly (infer U)[]
    ? DeepDereference<U>[]
    : T extends object
      ? {
          [K in keyof T]: T[K] extends RefNode<any> ? DeepDereference<T[K]> | '[circular]' : DeepDereference<T[K]>
        }
      : T
  : Dereference<T> extends object
    ? {
        [K in keyof Dereference<T>]: Dereference<T>[K] extends RefNode<any>
          ? DeepDereference<Dereference<T>[K]> | '[circular]'
          : DeepDereference<Dereference<T>[K]>
      }
    : Dereference<T>
/**
 * Recursively resolves all $ref objects in a data structure to their actual values.
 * Traverses through objects, arrays, and nested structures to find and resolve
 * any $ref references at any depth level.
 *
 * Handles circular references gracefully by detecting them and returning '[circular]'
 * to prevent infinite loops.
 */
export declare const getResolvedRefDeep: <Node>(node: NodeInput<Node>) => DeepDereference<NodeInput<Node>>
export {}
//# sourceMappingURL=get-resolved-ref-deep.d.ts.map
