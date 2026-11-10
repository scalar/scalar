import type { FuncKeywordDefinition } from 'ajv'
import { _, str } from 'ajv/dist/compile/codegen/index.js'

/** A finite decimal written as an integer coefficient times a power of ten. */
type Decimal = { coefficient: bigint; exponent: number }

const toDecimal = (value: number): Decimal => {
  const [mantissa = '', exponent = '0'] = value.toString().split('e')
  const [integer = '', fraction = ''] = mantissa.split('.')
  return { coefficient: BigInt(integer + fraction), exponent: Number(exponent) - fraction.length }
}

/**
 * Replace Ajv's floating-point multipleOf check with exact decimal divisibility.
 *
 * Use the decimal representation of each JavaScript number, including scientific notation.
 * This avoids both rounding-error rejections and tolerance-based false positives. Precision
 * already lost when parsing JSON into JavaScript numbers cannot be recovered here.
 */
export const decimalMultipleOf: FuncKeywordDefinition = {
  keyword: 'multipleOf',
  type: 'number',
  schemaType: 'number',
  errors: false,
  error: {
    message: ({ schemaCode }) => str`must be multiple of ${schemaCode}`,
    params: ({ schemaCode }) => _`{multipleOf: ${schemaCode}}`,
  },
  compile: (divisor: number): ((value: number) => boolean) => {
    if (!Number.isFinite(divisor) || divisor <= 0) {
      throw new Error('multipleOf must be a finite number greater than 0')
    }

    const denominator = toDecimal(divisor)
    return (value: number): boolean => {
      if (!Number.isFinite(value)) {
        return false
      }

      const numerator = toDecimal(value)
      const exponent = numerator.exponent - denominator.exponent
      // Align decimal places before taking the remainder; never divide floating-point numbers.
      return exponent >= 0
        ? (numerator.coefficient * 10n ** BigInt(exponent)) % denominator.coefficient === 0n
        : numerator.coefficient % (denominator.coefficient * 10n ** BigInt(-exponent)) === 0n
    }
  },
}
