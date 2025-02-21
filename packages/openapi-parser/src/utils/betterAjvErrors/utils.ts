// Basic
const eq = (x) => (y) => x === y
const not = (fn) => (x) => !fn(x)

const getValues = (o) => Object.values(o)

export const notUndefined = (x) => x !== undefined

// Error
const isXError = (x) => (error) => error.keyword === x
export const isRequiredError = isXError('required')
export const isAnyOfError = isXError('anyOf')
export const isEnumError = isXError('enum')
export const getErrors = (node) => node?.errors || []

// Node
export const getChildren = (node) => (node && getValues(node.children)) || []

export const getSiblings = (parent /*: Node */) => (node /*: Node */) /*: $ReadOnlyArray<Node> */ =>
  getChildren(parent).filter(not(eq(node)))

export const concatAll =
  /* ::<T> */

  (xs /*: $ReadOnlyArray<T> */) => (ys /* : $ReadOnlyArray<T> */) /* : $ReadOnlyArray<T> */ =>
    ys.reduce((zs, z) => zs.concat(z), xs)
