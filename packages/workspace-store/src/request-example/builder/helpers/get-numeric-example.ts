/** The coefficient and power of ten in the decimal representation emitted as JSON. */
type Decimal = {
  coefficient: bigint
  exponent: number
}

const toDecimal = (value: number): Decimal => {
  const [mantissa = '', exponent = '0'] = value.toString().split('e')
  const [whole, fraction = ''] = mantissa.split('.')
  return { coefficient: BigInt(`${whole}${fraction}`), exponent: Number(exponent) - fraction.length }
}

const scaleDecimal = ({ coefficient, exponent }: Decimal, scale: number): bigint =>
  coefficient * 10n ** BigInt(exponent - scale)

const greatestCommonDivisor = (first: bigint, second: bigint): bigint => {
  let left = first
  let right = second
  while (right !== 0n) {
    const remainder = left % right
    left = right
    right = remainder
  }
  return left
}

const floorDivide = (value: bigint, divisor: bigint): bigint => value / divisor - (value % divisor < 0n ? 1n : 0n)

/** Move one representable number inward from a strict bound, including at subnormal magnitudes. */
const adjacentNumber = (value: number, direction: 1 | -1): number => {
  if (value === 0) {
    return direction * Number.MIN_VALUE
  }
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  const increment = (value > 0 ? direction : -direction) === 1 ? 1n : -1n
  view.setBigUint64(0, view.getBigUint64(0) + increment)
  return view.getFloat64(0)
}

/** Keep precision recovery bounded even when the schema spans a huge range. */
const MAX_PRECISION_CANDIDATES = 64

const gridValue = (coefficient: bigint, exponent: number): number | undefined => {
  const value = Number(`${coefficient}e${exponent}`)
  if (!Number.isFinite(value)) {
    return undefined
  }
  // Parsing may round the decimal to a number whose JSON representation differs.
  const rounded = toDecimal(value)
  const scale = Math.min(exponent, rounded.exponent)
  return scaleDecimal(rounded, scale) === scaleDecimal({ coefficient, exponent }, scale) ? value : undefined
}

/** Try nearby multiples and the interval edges, then check a bounded window on the grid. */
const findGridValue = (
  grid: { lower: bigint; upper: bigint; target: bigint; scale: number },
  stride: bigint,
): number | undefined => {
  const { lower, upper, target, scale } = grid
  const first = -floorDivide(-lower, stride)
  const last = floorDivide(upper, stride)
  if (first > last) {
    return undefined
  }

  const preferredIndex = -floorDivide(-target, stride)
  const closest = preferredIndex > last ? last : preferredIndex
  for (const candidate of [closest, closest + 1n, closest - 1n, first, last, 0n]) {
    if (candidate >= first && candidate <= last) {
      const value = gridValue(candidate * stride, scale)
      if (value !== undefined) {
        return value
      }
    }
  }
  const count = BigInt(MAX_PRECISION_CANDIDATES)
  const centered = closest - count / 2n
  const rightmostStart = last - count + 1n
  const start = centered < rightmostStart ? centered : rightmostStart
  const firstCandidate = start < first ? first : start
  for (let candidate = firstCandidate; candidate <= last && candidate < firstCandidate + count; candidate++) {
    const value = gridValue(candidate * stride, scale)
    if (value !== undefined) {
      return value
    }
  }
  return undefined
}

/** A small interval can contain many exact multiples but very few representable numbers. */
const findRepresentableMultiple = (
  lower: number,
  upper: number,
  step: Decimal,
  integer: boolean,
): number | undefined => {
  let value = lower
  for (let attempt = 0; attempt < MAX_PRECISION_CANDIDATES && Number.isFinite(value) && value <= upper; attempt++) {
    if (!integer || Number.isInteger(value)) {
      const decimal = toDecimal(value)
      const scale = Math.min(decimal.exponent, step.exponent)
      if (scaleDecimal(decimal, scale) % scaleDecimal(step, scale) === 0n) {
        return value
      }
    }
    value = adjacentNumber(value, 1)
  }
  return undefined
}

const leastCommonMultiple = (left: bigint, right: bigint): bigint => (left / greatestCommonDivisor(left, right)) * right

/** Search exact multiples, using coarser decimal grids when the step is smaller than number precision. */
const getSteppedExample = (
  target: number,
  lower: number,
  upper: number,
  multipleOf: number,
  integer: boolean,
): number | undefined => {
  const step = toDecimal(multipleOf)
  const min = toDecimal(Math.max(lower, -Number.MAX_VALUE))
  const max = toDecimal(Math.min(upper, Number.MAX_VALUE))
  const preferred = toDecimal(target)
  const scale = Math.min(step.exponent, min.exponent, max.exponent, preferred.exponent, 0)
  const grid = {
    lower: scaleDecimal(min, scale),
    upper: scaleDecimal(max, scale),
    target: scaleDecimal(preferred, scale),
    scale,
  }
  const increment = scaleDecimal(step, scale)
  // Integer values are multiples of both the declared step and one.
  const stride = integer ? leastCommonMultiple(increment, 10n ** BigInt(-scale)) : increment
  const nearest = findGridValue(grid, stride)
  if (nearest !== undefined || target === 0) {
    return nearest
  }

  // For large or high-precision values, a nearby exact multiple can round to an invalid number.
  // Fewer significant decimal digits keep the candidates representable while preserving the step.
  const magnitude = preferred.exponent + preferred.coefficient.toString().replace('-', '').length - 1
  for (const digits of [17, 16, 15]) {
    const exponent = magnitude - digits + 1
    if (exponent > scale) {
      const coarser = leastCommonMultiple(stride, 10n ** BigInt(exponent - scale))
      const value = findGridValue(grid, coarser)
      if (value !== undefined) {
        return value
      }
    }
  }
  return findRepresentableMultiple(Number.isFinite(lower) ? lower : target, upper, step, integer)
}

const readBound = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

/** Generate a finite numeric sample from a normalized OpenAPI Schema Object. */
export const getNumericExample = (schema: object, integer: boolean): number => {
  const minimum = readBound('minimum' in schema ? schema.minimum : undefined)
  const maximum = readBound('maximum' in schema ? schema.maximum : undefined)
  const exclusiveMinimum = readBound('exclusiveMinimum' in schema ? schema.exclusiveMinimum : undefined)
  const exclusiveMaximum = readBound('exclusiveMaximum' in schema ? schema.exclusiveMaximum : undefined)
  const multipleOf = readBound('multipleOf' in schema ? schema.multipleOf : undefined)

  const lower = Math.max(
    minimum ?? Number.NEGATIVE_INFINITY,
    exclusiveMinimum === undefined ? Number.NEGATIVE_INFINITY : adjacentNumber(exclusiveMinimum, 1),
  )
  const upper = Math.min(
    maximum ?? Number.POSITIVE_INFINITY,
    exclusiveMaximum === undefined ? Number.POSITIVE_INFINITY : adjacentNumber(exclusiveMaximum, -1),
  )
  const fallback = integer ? Math.ceil(minimum ?? 1) : (minimum ?? 1)
  if (lower > upper) {
    return fallback
  }

  // Prefer the lower bound when present, choosing a simple whole number above a strict bound.
  const preferred =
    exclusiveMinimum !== undefined && lower > (minimum ?? Number.NEGATIVE_INFINITY)
      ? Math.floor(exclusiveMinimum) + 1
      : (minimum ?? 1)
  const belowExclusiveMaximum = exclusiveMaximum === undefined ? upper : Math.ceil(exclusiveMaximum) - 1
  const cap = preferred > upper && belowExclusiveMaximum >= lower ? Math.min(upper, belowExclusiveMaximum) : upper
  const target = Math.max(lower, Math.min(preferred, cap))
  if (!Number.isFinite(target)) {
    return fallback
  }

  if (multipleOf !== undefined && multipleOf > 0) {
    return getSteppedExample(target, lower, upper, multipleOf, integer) ?? fallback
  }
  if (!integer) {
    // A rounded midpoint keeps narrow open intervals readable when it still fits the bounds.
    if (
      preferred > upper &&
      belowExclusiveMaximum < lower &&
      exclusiveMinimum !== undefined &&
      exclusiveMaximum !== undefined
    ) {
      const midpoint = Number((exclusiveMinimum / 2 + exclusiveMaximum / 2).toPrecision(15))
      if (midpoint >= lower && midpoint <= upper) {
        return midpoint
      }
    }
    return target
  }

  const ceiling = Math.ceil(target)
  if (ceiling <= upper) {
    return ceiling || 0
  }
  const floor = Math.floor(upper)
  return floor >= lower ? floor || 0 : fallback
}
