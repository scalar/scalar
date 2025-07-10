import { Type, type TLiteral, type TUnion } from '@sinclair/typebox'

type IntoStringLiteralUnion<T> = T extends readonly (infer U)[] ? (U extends string ? TLiteral<U> : never) : never

/**
 * Converts an array of strings into a TypeBox union of string literals
 *
 * @see https://github.com/sinclairzx81/typebox/issues/105#issuecomment-917385119
 */
export const stringLiteralUnion = <T extends readonly string[] | string[]>(
  values: T,
): TUnion<IntoStringLiteralUnion<T>[]> => {
  const literals = values.map((value) => Type.Literal(value))
  return Type.Union(literals) as TUnion<IntoStringLiteralUnion<T>[]>
}
