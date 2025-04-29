import BaseValidationError, { type BaseValidationErrorOptions } from './base'

export default class DefaultValidationError extends BaseValidationError {
  constructor(
    options: BaseValidationErrorOptions,
    context: { data?: any; schema?: any; jsonAst?: any; jsonRaw?: any },
  ) {
    super(options, context)
    this.name = 'DefaultValidationError'
    this.options.isSkipEndLocation = true
  }

  getError(): { message: string; path: string | undefined } {
    const { keyword, message } = this.options

    return {
      message: `${keyword} ${message}`,
      path: this.instancePath,
    }
  }
}
