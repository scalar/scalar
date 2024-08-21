/** Encompases anything we may see as both input/output data for an API call */
export type SuperDataType = {
  Null: null
  Undefined: undefined
  Boolean: boolean
  Number: number
  BigInt: bigint
  String: string
  Symbol: symbol
  Objct: object
  ArrayAny: Array<any>
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
