import type { ExternalType } from './more-testing-types'

const num = 20

/**
 * Encompases anything we may see as both input/output data for an API call
 *
 * But we shall also test the jsDoc capabilities and see what comes of this
 *
 * @default false
 * @description You will be absolutely blown away by this schema
 * @deprecated this is actually deprecated
 * @example 'this is but an example'
 * @name ScalarUser99
 * @constant 12
 * @enum ['this','that','again']
 * @summary To summarize or not to summarize
 */
export type SuperDataType = {
  Null: null
  Undefined: undefined
  Boolean: boolean
  boolLiteral: false
  Number: number
  numerLiteral: 38
  BigInt: bigint
  bigIntLiteral: 546515156165156424n
  /** Lets describe this string */
  nested: {
    /**
     * This is a nested desc
     *
     * @default 'Default string for a'
     */
    a: string
    b: ExternalType
  }
  String: string
  stringLiteral: 'Literally a string value'
  // nullableString: string | null
  // optionalString?: string
  // optionalString2: string | undefined
  typeQuery: typeof num
  Object: object
  objectLiteral: {
    bool: true
    num: 123
    boolType: boolean
    numType: number
    stringer: 'who'
  }
  Any: any
  ArrayAny: any[]
  ArrayAnyTypeReference: Array<any>
  ArrayString: string[]
  RecordAny: Record<string, any>
  RecordNumber: Record<string, number>
  date: Date
  int8Array: Int8Array
  uInt8Array: Uint8Array
  UInt8ClampedArray: Uint8ClampedArray
  int16Array: Int16Array
  uint16Array: Uint16Array
  int32Array: Int32Array
  uint32Array: Uint32Array
  float32Array: Float32Array
  float64Array: Float64Array
  error: Error
  keyString: { [key: string]: any }
  keyNumber: { [key: number]: any }
  keySymbol: { [key: symbol]: any }
  keyAB: { a: number; b: string }
  tupleMixed: [number, string, ...boolean[]]
  unionNumericLiteral: 1 | 2 | 3
  unionBoolean: true | false
  unionMixed: string | number | boolean
  inersection: string & number
  optional: { a: number; b?: string }
  deep: { a: { b: { c: number } } }
  unionMixedObject: string | { [key: string]: any }
  Never: never
}
