/**
 * Type helper for checking that types are equal
 *
 * Use in conjunction with Expect to assert that types are equal at compile time
 *
 * @example
 * type Test = Expect<Equal<{ a: number }, { a: string }>>
 */
export type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
