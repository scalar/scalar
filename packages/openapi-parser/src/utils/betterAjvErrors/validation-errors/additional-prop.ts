import BaseValidationError, { type BaseValidationErrorOptions } from './base'

export default class AdditionalPropValidationError extends BaseValidationError {
  constructor(
    options: BaseValidationErrorOptions,
    context: { data?: any; schema?: any; jsonAst?: any; jsonRaw?: any },
  ) {
    super(options, context)
    this.name = 'AdditionalPropValidationError'
    this.options.isIdentifierLocation = true
  }

  getError(): { message: string; path: string | undefined } {
    const { params } = this.options

    return {
      message: `Property ${params?.additionalProperty} is not expected to be here`,
      path: this.instancePath,
    }
  }
}
