import BaseValidationError from './base'

export default class DefaultValidationError extends BaseValidationError {
  constructor(...args) {
    super(...args)
    this.name = 'DefaultValidationError'
    this.options.isSkipEndLocation = true
  }

  getError() {
    const { keyword, message } = this.options

    return {
      message: `${keyword} ${message}`,
      path: this.instancePath,
    }
  }
}
