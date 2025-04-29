import BaseValidationError, { type BaseValidationErrorOptions } from './base'

export default class RequiredValidationError extends BaseValidationError {
  constructor(
    options: BaseValidationErrorOptions,
    context: { data?: any; schema?: any; jsonAst?: any; jsonRaw?: any },
  ) {
    super(options, context)
    this.name = 'RequiredValidationError'
  }

  getError(): { message: string; path: string | undefined } {
    const { message } = this.options

    return {
      message: `${message}`,
      path: this.instancePath,
    }
  }
}
