import BaseValidationError from './base'

export default class AdditionalPropValidationError extends BaseValidationError {
  constructor(...args) {
    super(...args)
    this.name = 'AdditionalPropValidationError'
    this.options.isIdentifierLocation = true
  }

  getError() {
    const { params } = this.options

    return {
      message: `Property ${params.additionalProperty} is not expected to be here`,
      path: this.instancePath,
    }
  }
}
