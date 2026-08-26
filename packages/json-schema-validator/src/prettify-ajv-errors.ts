/**
 * Turns raw Ajv validation errors into a short list of human-friendly messages.
 *
 * Ajv reports every failing branch of a schema, which for OpenAPI documents
 * (full of `oneOf`/`anyOf`) means a lot of noise. We group the errors into a
 * tree by JSON Pointer, prune the redundant ones so the most actionable message
 * wins, and then word each remaining error per keyword.
 */

/**
 * A single raw Ajv validation error.
 *
 * This is a forgiving, partial shape: Ajv attaches different fields depending on
 * the keyword, and we only read a handful of them.
 */
export type AjvError = {
  keyword: string
  instancePath?: string
  /** Ajv < 8 used `dataPath` instead of `instancePath`. */
  dataPath?: string
  schemaPath?: string
  message?: string
  propertyName?: string
  params?: Record<string, any>
}

/** A prettified, human-friendly validation error. */
export type PrettyError = {
  message: string
  path?: string
}

/** A node in the tree of errors, grouped by JSON Pointer segment. */
type ErrorNode = {
  errors: AjvError[]
  children: Record<string, ErrorNode>
}

const JSON_POINTERS_REGEX = /\/[\w$_-]+(\/\d+)?/g

const isKeyword = (keyword: string) => (error: AjvError) => error.keyword === keyword
const isRequiredError = isKeyword('required')
const isAnyOfError = isKeyword('anyOf')
const isOneOfError = isKeyword('oneOf')
const isIfError = isKeyword('if')
const isEnumError = isKeyword('enum')
const isAdditionalPropertiesError = isKeyword('additionalProperties')
const isUnevaluatedPropertiesError = isKeyword('unevaluatedProperties')

const getChildren = (node: ErrorNode): ErrorNode[] => Object.values(node.children)

/** Whether the node currently has any child nodes. */
const hasChildren = (node: ErrorNode): boolean => Object.keys(node.children).length > 0

/**
 * Whether this node, or anything below it, carries a non-`enum` error.
 *
 * Pruning decisions look at whole subtrees: a sibling that only holds errors on
 * its own children still counts. Only non-`enum` errors count as "more
 * specific", so a bare `enum` error is not dropped merely because a sibling also
 * failed its own `enum` — both of those are equally actionable and must survive.
 */
const hasMoreSpecificErrorDeep = (node: ErrorNode): boolean =>
  node.errors.some((error) => !isEnumError(error)) || getChildren(node).some(hasMoreSpecificErrorDeep)

/**
 * The JSON Pointer to the value that failed validation. Ajv exposes this as
 * `instancePath`; older versions used `dataPath`.
 */
const getInstancePath = (error: AjvError): string =>
  error.instancePath !== undefined ? error.instancePath : (error.dataPath ?? '')

/**
 * The name of the property an error points at.
 *
 * Ajv only sets `propertyName` for the `propertyNames` keyword, so for every
 * other keyword the name has to come from the last segment of the instance
 * path. Returns `undefined` when the error points at the document root or at an
 * array item, neither of which has a property name to report.
 *
 * A numeric segment is only an array index when the value holding it really is
 * an array — OpenAPI is full of numeric object keys, `responses.404` among them
 * — so the document decides, not the shape of the segment.
 */
const getPropertyName = (error: AjvError, document: unknown): string | undefined => {
  if (error.propertyName) {
    return error.propertyName
  }

  const segments = pointerSegments(getInstancePath(error))
  const last = segments.at(-1)

  if (last === undefined) {
    return undefined
  }

  if (/^\d+$/.test(last) && Array.isArray(resolvePointer(document, segments.slice(0, -1)))) {
    return undefined
  }

  return last
}

/**
 * Words a single Ajv error, dispatched by keyword.
 */
function formatError(error: AjvError, document: unknown): PrettyError {
  const path = getInstancePath(error)

  switch (error.keyword) {
    case 'additionalProperties':
      return { message: `Property ${error.params?.additionalProperty} is not expected to be here`, path }

    case 'unevaluatedProperties':
      return { message: `Property ${error.params?.unevaluatedProperty} is not expected to be here`, path }

    case 'pattern': {
      const propertyName = getPropertyName(error, document)

      return {
        message: propertyName
          ? `Property "${propertyName}" must match pattern ${error.params?.pattern}`
          : `${error.keyword} ${error.message}`,
        path,
      }
    }

    case 'required':
      return { message: `${error.message}`, path }

    case 'format':
      return formatFormatError(error, document)

    default:
      return { message: `${error.keyword} ${error.message}`, path }
  }
}

/**
 * Merges the allowed values of one or more `enum` errors into a single message.
 */
function formatEnumError(allowedValues: unknown[], error: AjvError): PrettyError {
  return { message: `${error.message}: ${allowedValues.join(', ')}`, path: getInstancePath(error) }
}

/**
 * Adds context for `format` failures. Currently only `uri-reference` on `$ref`
 * values, where the raw value is worth surfacing (for example non-ASCII
 * characters). Everything else falls back to the default message.
 */
function formatFormatError(error: AjvError, document: unknown): PrettyError {
  const path = getInstancePath(error)

  if (error.params?.format === 'uri-reference' && path.endsWith('/$ref')) {
    return { message: uriReferenceMessage(document, path), path }
  }

  return { message: `${error.keyword} ${error.message}`, path }
}

function uriReferenceMessage(document: unknown, path: string): string {
  const refValue = extractRefValue(document, path)

  if (refValue && /[^\x00-\x7F]/.test(refValue)) {
    return `$ref "${refValue}" contains non-ASCII characters`
  }

  if (refValue) {
    return `$ref "${refValue}" is not a valid URI reference`
  }

  return '$ref is not a valid URI reference'
}

/** Decodes the `~1` and `~0` escapes of a single JSON Pointer segment. */
const unescapePointerSegment = (segment: string): string => segment.replace(/~1/g, '/').replace(/~0/g, '~')

/** Splits a JSON Pointer into its decoded segments. */
const pointerSegments = (path: string): string[] => path.split('/').filter(Boolean).map(unescapePointerSegment)

/**
 * Walks the document along a list of JSON Pointer segments.
 *
 * Returns `undefined` as soon as the path leaves the document.
 */
function resolvePointer(document: unknown, segments: string[]): unknown {
  let current: unknown = document

  for (const segment of segments) {
    if (current === null || typeof current !== 'object') {
      return undefined
    }

    current = (current as Record<string, unknown>)[segment]
  }

  return current
}

/**
 * Walks the document along a JSON Pointer to read the actual `$ref` value.
 */
function extractRefValue(document: unknown, path: string): string | null {
  if (!document || typeof document !== 'object' || !path) {
    return null
  }

  const value = resolvePointer(document, pointerSegments(path))

  return typeof value === 'string' ? value : null
}

/**
 * Groups a flat list of Ajv errors into a tree keyed by JSON Pointer segments.
 */
function makeTree(ajvErrors: AjvError[]): ErrorNode {
  const root: ErrorNode = { errors: [], children: {} }

  for (const ajvError of ajvErrors) {
    const instancePath = getInstancePath(ajvError)
    // The pointer pattern only recognizes ASCII-word segments. A path it cannot
    // match (a Unicode property name, for example) still has to be reported, so
    // give it a node of its own keyed by the whole path. Grouping it under the
    // root instead would expose it to the root's own pruning rules, which drop
    // everything next to a `required` error.
    const paths = instancePath === '' ? [''] : (instancePath.match(JSON_POINTERS_REGEX) ?? [instancePath])

    paths.reduce((node, path, index) => {
      node.children[path] = node.children[path] ?? { errors: [], children: {} }

      if (index === paths.length - 1) {
        node.children[path].errors.push(ajvError)
      }

      return node.children[path]
    }, root)
  }

  return root
}

/**
 * The flags a node's pruning decisions depend on, derived once from the errors
 * as first seen so a rule never reacts to an earlier rule's output.
 */
type NodeErrorFlags = {
  hasOneOf: boolean
  hasAnyOf: boolean
  hasRequired: boolean
  hasIf: boolean
  /** `additionalProperties` or `unevaluatedProperties` — treated the same here. */
  hasExtraProperties: boolean
  /** Whether the node had children when first seen, before any rule cleared them. */
  hasChildren: boolean
}

/**
 * Resolves the `oneOf`/`required` tangle at a single node.
 *
 * OpenAPI's `oneOf: [Schema, Reference]` unions make `oneOf` and `required` fire
 * together, and the right message depends on what else failed. `errors` is the
 * node's list as first seen; every branch resets from it, so the decision never
 * depends on a prior rule's output.
 */
function resolveCompositionAndRequired(node: ErrorNode, errors: AjvError[], flags: NodeErrorFlags): void {
  if (flags.hasOneOf && flags.hasRequired) {
    if (flags.hasExtraProperties) {
      // A concrete `additionalProperties`/`unevaluatedProperties` error is the
      // actionable one; drop the `required`/`oneOf` branch noise around it.
      node.errors = errors.filter((error) => !isRequiredError(error) && !isOneOfError(error))
    } else if (flags.hasChildren) {
      // The children carry the specific reason, so drop this node's errors.
      node.errors = []
    } else {
      // Both `oneOf` branches produced a `required` error: one from the schema the
      // user most likely intended (e.g. a Response needs `description`) and one
      // from the `Reference` branch (needs `$ref`). Surface the intended error and
      // drop the `$ref` noise, falling back to the generic `oneOf` error only when
      // the sole requirement left is `$ref` (i.e. the value looks like a broken ref).
      const meaningfulRequiredErrors = errors.filter(
        (error) => isRequiredError(error) && error.params?.missingProperty !== '$ref',
      )
      node.errors = meaningfulRequiredErrors.length > 0 ? meaningfulRequiredErrors : errors.filter(isOneOfError)
    }
  } else if (flags.hasOneOf && flags.hasChildren) {
    // Only a `oneOf` error with children: let the more specific children surface.
    node.errors = []
  } else if (flags.hasOneOf) {
    // Multiple duplicate `oneOf` errors from different branches: keep just one.
    const oneOfErrors = errors.filter(isOneOfError)

    if (oneOfErrors.length > 1) {
      node.errors = [oneOfErrors[0]]
    }
  } else if (flags.hasRequired) {
    // A missing property makes the rest of that object's errors moot, so a
    // `required` error wins outright — over `anyOf`, and over the children.
    node.errors = errors.filter(isRequiredError)
    node.children = {}
  }
}

/**
 * Drops a node whose errors are all `enum` errors when a sibling carries a more
 * specific (non-`enum`) error. Two properties each failing their own `enum` are
 * equally actionable, so neither silences the other. The root node's key is the
 * empty string, so compare `key` against `undefined` rather than truthiness.
 */
function pruneEnumNextToSpecificSibling(node: ErrorNode, parent?: ErrorNode, key?: string): void {
  if (!(node.errors.length > 0 && node.errors.every(isEnumError) && parent && key !== undefined)) {
    return
  }

  // The more specific error is often on a grandchild rather than the sibling
  // itself, so weigh whole subtrees.
  const siblingsHaveMoreSpecificErrors = getChildren(parent)
    .filter((sibling) => sibling !== node)
    .some(hasMoreSpecificErrorDeep)

  if (siblingsHaveMoreSpecificErrors) {
    delete parent.children[key]
  }
}

/**
 * Prunes redundant errors from the tree so the most actionable message wins.
 *
 * Ajv reports every failing branch, which for OpenAPI (full of `oneOf`/`anyOf`/
 * `if`) is mostly noise. The rules rank errors by how specific they are:
 *
 *   - "container" errors — `oneOf`, `anyOf`, `if` — only report that a branch
 *     failed, never why, so they yield to any more specific error that survives.
 *   - `required` is specific and terminal: a missing property makes the rest of
 *     that object's errors moot (except the `oneOf: [Schema, Reference]` pattern,
 *     resolved first).
 *   - `enum` is specific but weak: a more specific sibling error wins.
 *   - everything else (`type`, `pattern`, `format`, …) is specific and kept.
 *
 * The steps below run in order and mutate the node; the ordering is load-bearing
 * and called out where it matters.
 */
function filterRedundantErrors(node: ErrorNode, parent?: ErrorNode, key?: string): void {
  // Snapshot the errors and the flags derived from them. Later steps reset from
  // this snapshot, so an earlier filter never hides a keyword a later step weighs.
  const errors = node.errors
  const flags: NodeErrorFlags = {
    hasOneOf: errors.some(isOneOfError),
    hasAnyOf: errors.some(isAnyOfError),
    hasRequired: errors.some(isRequiredError),
    hasIf: errors.some(isIfError),
    hasExtraProperties: errors.some(isAdditionalPropertiesError) || errors.some(isUnevaluatedPropertiesError),
    hasChildren: hasChildren(node),
  }

  // 1. An `if` error next to an `additionalProperties`/`unevaluatedProperties`
  //    error is just noise from the if/then/else conditional.
  if (flags.hasIf && flags.hasExtraProperties) {
    node.errors = errors.filter((error) => !isIfError(error))
  }

  // 2. Resolve the `oneOf`/`required` composition tangle.
  resolveCompositionAndRequired(node, errors, flags)

  // 3. A container error whose real cause sits in a surviving child is noise.
  //    Re-check children live: step 2's `required` branch may have cleared them,
  //    and wiping the errors then would drop the actionable `required` message.
  if (flags.hasAnyOf && hasChildren(node)) {
    node.errors = []
  }

  if (flags.hasIf && hasChildren(node)) {
    node.errors = node.errors.filter((error) => !isIfError(error))
  }

  // 4. An all-`enum` node yields to a more specific sibling.
  pruneEnumNextToSpecificSibling(node, parent, key)

  for (const [childKey, child] of Object.entries(node.children)) {
    filterRedundantErrors(child, node, childKey)
  }
}

/**
 * Turns the filtered tree into a flat list of prettified errors.
 */
function createErrors(node: ErrorNode, document: unknown): PrettyError[] {
  const errors = node.errors

  // When every error at this node is an `enum` error, merge their allowed values
  // into a single message instead of repeating the same error.
  if (errors.length > 0 && errors.every(isEnumError)) {
    const allowedValues = [...new Set(errors.flatMap((error) => error.params?.allowedValues ?? []))]

    return [formatEnumError(allowedValues, errors[0])]
  }

  const own = errors.map((error) => formatError(error, document))
  const children = getChildren(node).flatMap((child) => createErrors(child, document))

  return [...own, ...children]
}

/**
 * Prettifies a list of raw Ajv validation errors against the validated document.
 */
export function prettifyAjvErrors(document: unknown, errors: AjvError[]): PrettyError[] {
  const tree = makeTree(errors ?? [])
  filterRedundantErrors(tree)

  return createErrors(tree, document)
}
