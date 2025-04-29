import pointer from 'jsonpointer'
import leven from 'leven'

import BaseValidationError, { type BaseValidationErrorOptions } from './base'

export default class EnumValidationError extends BaseValidationError {
  constructor(
    options: BaseValidationErrorOptions,
    context: { data?: any; schema?: any; jsonAst?: any; jsonRaw?: any },
  ) {
    super(options, context)
    this.name = 'EnumValidationError'
  }

  getError(): { message: string; path: string | undefined; suggestion?: string } {
    const { message, params } = this.options
    const bestMatch = this.findBestMatch()
    const allowedValues = params?.allowedValues?.join(', ')

    const output: { message: string; path: string | undefined; suggestion?: string } = {
      message: `${message}: ${allowedValues}`,
      path: this.instancePath,
    }

    if (bestMatch !== null) {
      output.suggestion = `Did you mean ${bestMatch}?`
    }

    return output
  }

  findBestMatch(): string | null {
    const allowedValues = this.options.params?.allowedValues
    if (!allowedValues) return null

    const currentValue = this.instancePath === '' ? this.data : pointer.get(this.data, this.instancePath)

    if (!currentValue) {
      return null
    }

    const bestMatch = allowedValues
      .map((value: string) => ({
        value,
        weight: leven(value, currentValue.toString()),
      }))
      .sort((x, y) => (x.weight > y.weight ? 1 : x.weight < y.weight ? -1 : 0))[0]

    return allowedValues.length === 1 || bestMatch.weight < bestMatch.value.length ? bestMatch.value : null
  }
}
