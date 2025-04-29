import BaseValidationError, { type BaseValidationErrorOptions } from './base'

export default class PatternValidationError extends BaseValidationError {
  constructor(
    options: BaseValidationErrorOptions,
    context: { data?: any; schema?: any; jsonAst?: any; jsonRaw?: any },
  ) {
    super(options, context)
    this.name = 'PatternValidationError'
    this.options.isIdentifierLocation = true
  }

  getError(): { message: string; path: string | undefined } {
    const { params, propertyName } = this.options

    return {
      message: `Property "${propertyName}" must match pattern ${params?.pattern}`,
      path: this.instancePath,
    }
  }
}
