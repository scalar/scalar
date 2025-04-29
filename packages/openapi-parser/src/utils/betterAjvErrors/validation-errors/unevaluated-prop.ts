import BaseValidationError, { type BaseValidationErrorOptions } from './base'

export default class UnevaluatedPropValidationError extends BaseValidationError {
  constructor(
    options: BaseValidationErrorOptions,
    context: { data?: any; schema?: any; jsonAst?: any; jsonRaw?: any },
  ) {
    super(options, context)
    this.name = 'UnevaluatedPropValidationError'
    this.options.isIdentifierLocation = true
  }

  getError(): { message: string; path: string | undefined } {
    const { params } = this.options

    return {
      message: `Property ${params?.unevaluatedProperty} is not expected to be here`,
      path: this.instancePath,
    }
  }
}
