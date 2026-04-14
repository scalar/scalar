/**
 * Type helper for asserting that a type is true
 *
 * Use in conjunction with Equal to assert that types are equal at compile time
 *
 * @example
 * type Test = Expect<Equal<{ a: number }, { a: string }>>
 *
 */
export type Expect<T extends true> = T
