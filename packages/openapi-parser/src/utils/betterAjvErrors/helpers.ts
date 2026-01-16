import {
  concatAll,
  getChildren,
  getErrors,
  getSiblings,
  isAdditionalPropertiesError,
  isAnyOfError,
  isEnumError,
  isIfError,
  isOneOfError,
  isRequiredError,
  isUnevaluatedPropertiesError,
  notUndefined,
} from './utils'
import {
  AdditionalPropValidationError,
  DefaultValidationError,
  EnumValidationError,
  PatternValidationError,
  RequiredValidationError,
  UnevaluatedPropValidationError,
} from './validation-errors'

const JSON_POINTERS_REGEX = /\/[\w_-]+(\/\d+)?/g

// Make a tree of errors from ajv errors array
function makeTree(ajvErrors = []) {
  const root = { children: {} }
  ajvErrors.forEach((ajvError) => {
    const instancePath = typeof ajvError.instancePath !== 'undefined' ? ajvError.instancePath : ajvError.dataPath

    // `dataPath === ''` is root
    const paths = instancePath === '' ? [''] : instancePath.match(JSON_POINTERS_REGEX)
    if (paths) {
      paths.reduce((obj, path, i) => {
        obj.children[path] = obj.children[path] || { children: {}, errors: [] }
        if (i === paths.length - 1) {
          obj.children[path].errors.push(ajvError)
        }
        return obj.children[path]
      }, root)
    }
  })
  return root
}

function filterRedundantErrors(root, parent, key) {
  const errors = getErrors(root)
  const hasOneOfError = errors.some(isOneOfError)
  const hasAnyOfError = errors.some(isAnyOfError)
  const hasRequiredError = errors.some(isRequiredError)
  const hasIfError = errors.some(isIfError)
  const hasAdditionalPropertiesError = errors.some(isAdditionalPropertiesError)
  const hasUnevaluatedPropertiesError = errors.some(isUnevaluatedPropertiesError)
  const hasChildren = Object.keys(root.children || {}).length > 0

  /**
   * If there is an `if` error with `additionalProperties` or `unevaluatedProperties` error,
   * filter out the `if` error as it's just noise from the if/then/else conditional.
   */
  if (hasIfError && (hasAdditionalPropertiesError || hasUnevaluatedPropertiesError)) {
    root.errors = errors.filter((error) => !isIfError(error))
  }

  /**
   * If there is a `oneOf` error with a `required` error:
   * 1. If there are other errors at this level (like additionalProperties), keep those
   * 2. If there are child errors, don't clear them - they're more meaningful
   * The `required` error is likely from a failed oneOf branch (e.g., Reference requiring $ref).
   */
  if (hasOneOfError && hasRequiredError) {
    if (hasAdditionalPropertiesError || hasUnevaluatedPropertiesError) {
      // Filter out the required and oneOf errors, keep the meaningful ones at this level
      root.errors = errors.filter((error) => !isRequiredError(error) && !isOneOfError(error))
    } else if (hasChildren) {
      // Clear parent errors, keep children as they're more meaningful
      delete root.errors
    } else {
      // No other errors, keep oneOf as it's all we have
      root.errors = errors.filter((error) => isOneOfError(error))
    }
  } else if (hasOneOfError && !hasRequiredError && hasChildren) {
    /**
     * If there is only a `oneOf` error (without required complications):
     * If there are child errors, clear the oneOf error to surface the children.
     * Children will have more specific information about why each branch failed.
     */
    // Clear the generic oneOf errors, let children surface
    delete root.errors
  } else if (hasOneOfError && !hasRequiredError && !hasChildren) {
    /**
     * If we have multiple oneOf errors (duplicates from different branches),
     * keep only one to avoid noise.
     */
    const oneOfErrors = errors.filter(isOneOfError)
    if (oneOfErrors.length > 1) {
      // Keep only the first oneOf error
      root.errors = [oneOfErrors[0]]
    }
  } else if (hasRequiredError && !hasOneOfError) {
    /**
     * If there is a `required` error (without oneOf complications),
     * then we can just skip everything else.
     * And, also `required` should have more priority than `anyOf`. @see #8
     */
    root.errors = errors.filter(isRequiredError)
    root.children = {}
  }

  /**
   * If there is an `anyOf` error that means we have more meaningful errors
   * inside children. So we will just remove all errors from this level.
   *
   * If there are no children, then we don't delete the errors since we should
   * have at least one error to report.
   */
  if (hasAnyOfError) {
    if (Object.keys(root.children).length > 0) {
      delete root.errors
    }
  }

  /**
   * If all errors are `enum` and siblings have any error then we can safely
   * ignore the node.
   *
   * **CAUTION**
   * Need explicit `root.errors` check because `[].every(fn) === true`
   * https://en.wikipedia.org/wiki/Vacuous_truth#Vacuous_truths_in_mathematics
   */
  if (root.errors?.length && getErrors(root).every(isEnumError)) {
    if (
      getSiblings(parent)(root)
        // Remove any reference which becomes `undefined` later
        .filter(notUndefined)
        .some(getErrors)
    ) {
      delete parent.children[key]
    }
  }

  Object.entries(root.children).forEach(([k, child]) => filterRedundantErrors(child, root, k))
}

function createErrorInstances(root, options): Array<EnumValidationError> {
  const errors = getErrors(root)
  if (errors.length && errors.every(isEnumError)) {
    const uniqueValues = new Set(concatAll([])(errors.map((e) => e.params.allowedValues)))
    const allowedValues = [...uniqueValues]
    const error = errors[0]
    return [
      new EnumValidationError(
        {
          ...error,
          params: { allowedValues },
        },
        options,
      ),
    ]
  }

  return concatAll(
    errors.reduce((ret, error) => {
      switch (error.keyword) {
        case 'additionalProperties':
          return ret.concat(new AdditionalPropValidationError(error, options))
        case 'pattern':
          return ret.concat(new PatternValidationError(error, options))
        case 'required':
          return ret.concat(new RequiredValidationError(error, options))
        case 'unevaluatedProperties':
          return ret.concat(new UnevaluatedPropValidationError(error, options))
        default:
          return ret.concat(new DefaultValidationError(error, options))
      }
    }, []),
  )(getChildren(root).map((child) => createErrorInstances(child, options)))
}

export default function prettify(ajvErrors, options) {
  const tree = makeTree(ajvErrors || [])
  // @ts-expect-error TODO
  filterRedundantErrors(tree)
  return createErrorInstances(tree, options)
}
