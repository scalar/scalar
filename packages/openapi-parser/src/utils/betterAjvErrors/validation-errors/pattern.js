import BaseValidationError from './base'

export default class PatternValidationError extends BaseValidationError {
  constructor(...args) {
    super(...args)
    this.name = 'PatternValidationError'
    this.options.isIdentifierLocation = true
  }

  getError() {
    const { params, propertyName } = this.options

    return {
      message: `Property "${propertyName}" must match pattern ${params.pattern}`,
      path: this.instancePath,
    }
  }
}
