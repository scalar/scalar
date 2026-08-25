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

/**
 * Whether this node, or anything below it, carries an error.
 *
 * Pruning decisions look at whole subtrees: a sibling that only holds errors on
 * its own children is still a sibling with errors.
 */
const hasErrorsDeep = (node: ErrorNode): boolean => node.errors.length > 0 || getChildren(node).some(hasErrorsDeep)

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
 * Prunes redundant errors from the tree so the most actionable message wins.
 *
 * The rules here are load-bearing (see the `oneOf`/`$ref` handling, which keeps
 * a missing `description` error instead of the misleading `$ref` one).
 */
function filterRedundantErrors(node: ErrorNode, parent?: ErrorNode, key?: string): void {
  const errors = node.errors
  const hasOneOfError = errors.some(isOneOfError)
  const hasAnyOfError = errors.some(isAnyOfError)
  const hasRequiredError = errors.some(isRequiredError)
  const hasIfError = errors.some(isIfError)
  const hasAdditionalPropertiesError = errors.some(isAdditionalPropertiesError)
  const hasUnevaluatedPropertiesError = errors.some(isUnevaluatedPropertiesError)
  const hasChildren = Object.keys(node.children).length > 0

  // An `if` error next to an `additionalProperties`/`unevaluatedProperties` error
  // is just noise from the if/then/else conditional.
  if (hasIfError && (hasAdditionalPropertiesError || hasUnevaluatedPropertiesError)) {
    node.errors = errors.filter((error) => !isIfError(error))
  }

  if (hasOneOfError && hasRequiredError) {
    if (hasAdditionalPropertiesError || hasUnevaluatedPropertiesError) {
      // Keep the meaningful errors at this level, drop `required`/`oneOf`.
      node.errors = errors.filter((error) => !isRequiredError(error) && !isOneOfError(error))
    } else if (hasChildren) {
      // Children are more meaningful than the parent's errors.
      node.errors = []
    } else {
      // Both `oneOf` branches produced a `required` error: one from the schema the
      // user most likely intended (e.g. a Response needs `description`) and one
      // from the `Reference` branch (needs `$ref`). Surface the intended error and
      // drop the `$ref` noise. Fall back to the generic `oneOf` error only when the
      // sole requirement left is `$ref` (i.e. the value looks like a broken ref).
      const meaningfulRequiredErrors = errors.filter(
        (error) => isRequiredError(error) && error.params?.missingProperty !== '$ref',
      )
      node.errors = meaningfulRequiredErrors.length > 0 ? meaningfulRequiredErrors : errors.filter(isOneOfError)
    }
  } else if (hasOneOfError && hasChildren) {
    // Only a `oneOf` error with children: let the more specific children surface.
    node.errors = []
  } else if (hasOneOfError) {
    // Multiple duplicate `oneOf` errors from different branches: keep just one.
    const oneOfErrors = errors.filter(isOneOfError)

    if (oneOfErrors.length > 1) {
      node.errors = [oneOfErrors[0]]
    }
  } else if (hasRequiredError) {
    // A `required` error takes priority over everything else, including `anyOf`.
    node.errors = errors.filter(isRequiredError)
    node.children = {}
  }

  // An `anyOf` error means the meaningful errors live in the children. Re-check
  // the children here rather than reusing `hasChildren`: the `required` branch
  // above may have just cleared them, and wiping the errors in that case would
  // drop the actionable `required` message.
  if (hasAnyOfError && Object.keys(node.children).length > 0) {
    node.errors = []
  }

  // If every error here is an `enum` error and a sibling has any error, this node
  // can be dropped as noise. `key` is compared against `undefined` rather than
  // checked for truthiness: the root node's key is the empty string, and it is
  // eligible for pruning like any other.
  if (node.errors.length > 0 && node.errors.every(isEnumError) && parent && key !== undefined) {
    // A sibling counts as having errors when anything in its subtree does — the
    // meaningful error is often on a grandchild rather than the sibling itself.
    const siblingsHaveErrors = getChildren(parent)
      .filter((sibling) => sibling !== node)
      .some(hasErrorsDeep)

    if (siblingsHaveErrors) {
      delete parent.children[key]
    }
  }

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
