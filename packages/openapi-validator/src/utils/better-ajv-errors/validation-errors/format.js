import BaseValidationError from './base'

/**
 * Enhanced error messages for `format` keyword validation failures.
 *
 * Currently provides context for:
 * - `uri-reference` format on `$ref` paths (non-ASCII characters, etc.)
 *
 * To add a new format enhancer, add a case to the switch in `getError()`.
 */
export default class FormatValidationError extends BaseValidationError {
  constructor(...args) {
    super(...args)
    this.name = 'FormatValidationError'
    this.options.isSkipEndLocation = true
  }

  getError() {
    const { keyword, message, params, instancePath: errorPath } = this.options
    const path = this.instancePath
    const format = params?.format

    // uri-reference format on $ref paths
    if (format === 'uri-reference' && path?.endsWith('/$ref')) {
      return {
        message: this._getUriReferenceMessage(),
        path,
      }
    }

    // Default: fall back to the same format as DefaultValidationError
    return {
      message: `${keyword} ${message}`,
      path,
    }
  }

  /**
   * Builds a contextual error message for uri-reference format failures on $ref values.
   */
  _getUriReferenceMessage() {
    const refValue = this._extractRefValue()

    if (refValue && /[^\x00-\x7F]/.test(refValue)) {
      return `$ref "${refValue}" contains non-ASCII characters`
    }

    if (refValue) {
      return `$ref "${refValue}" is not a valid URI reference`
    }

    return '$ref is not a valid URI reference'
  }

  /**
   * Attempts to extract the actual $ref value from the specification
   * by walking the instancePath through the spec object.
   */
  _extractRefValue() {
    const spec = this.schema
    if (!spec || typeof spec !== 'object') {
      return null
    }

    const path = this.instancePath
    if (!path) {
      return null
    }

    // Parse JSON Pointer segments, decoding ~1 (/) and ~0 (~)
    const segments = path
      .split('/')
      .filter(Boolean)
      .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'))

    let current = spec
    for (const segment of segments) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return null
      }
      current = current[segment]
    }

    return typeof current === 'string' ? current : null
  }
}
