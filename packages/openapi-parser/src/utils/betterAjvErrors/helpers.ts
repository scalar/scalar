import {
  concatAll,
  getChildren,
  getErrors,
  getSiblings,
  isAnyOfError,
  isEnumError,
  isRequiredError,
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
export function makeTree(ajvErrors = []) {
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

export function filterRedundantErrors(root, parent, key) {
  /**
   * If there is a `required` error then we can just skip everythig else.
   * And, also `required` should have more priority than `anyOf`. @see #8
   */
  getErrors(root).forEach((error) => {
    if (isRequiredError(error)) {
      root.errors = [error]
      root.children = {}
    }
  })

  /**
   * If there is an `anyOf` error that means we have more meaningful errors
   * inside children. So we will just remove all errors from this level.
   *
   * If there are no children, then we don't delete the errors since we should
   * have at least one error to report.
   */
  if (getErrors(root).some(isAnyOfError)) {
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

export function createErrorInstances(root, options) {
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
