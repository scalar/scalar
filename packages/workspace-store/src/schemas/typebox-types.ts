/**
 * See: https://github.com/sinclairzx81/typebox/discussions/835
 */

import {
  TypeGuard,
  Type,
  type TSchema,
  type TIntersect,
  type TUnion,
  type TObject,
  type TPartial,
  type TProperties,
  type Evaluate,
} from '@sinclair/typebox'

// -------------------------------------------------------------------------------------
// TPartialDeepProperties
// -------------------------------------------------------------------------------------
export type TPartialDeepProperties<T extends TProperties> = {
  [K in keyof T]: TPartialDeep<T[K]>
}
function PartialDeepProperties<T extends TProperties>(properties: T): TPartialDeepProperties<T> {
  return Object.getOwnPropertyNames(properties).reduce((acc, key) => {
    return { ...acc, [key]: PartialDeep(properties[key] as any) }
  }, {}) as never
}
// -------------------------------------------------------------------------------------
// TPartialDeepRest
// -------------------------------------------------------------------------------------
export type TPartialDeepRest<T extends TSchema[], Acc extends TSchema[] = []> = T extends [
  infer L extends TSchema,
  ...infer R extends TSchema[],
]
  ? TPartialDeepRest<R, [...Acc, TPartialDeep<L>]>
  : Acc
function PartialDeepRest<T extends TSchema[]>(rest: [...T]): TPartialDeepRest<T> {
  return rest.map((schema) => PartialDeep(schema)) as never
}
// -------------------------------------------------------------------------------------
// TPartialDeep
// -------------------------------------------------------------------------------------
export type TPartialDeep<T extends TSchema> = T extends TIntersect<infer S>
  ? TIntersect<TPartialDeepRest<S>>
  : T extends TUnion<infer S>
    ? TUnion<TPartialDeepRest<S>>
    : T extends TObject<infer S>
      ? TPartial<TObject<Evaluate<TPartialDeepProperties<S>>>>
      : T
export function PartialDeep<T extends TSchema>(schema: T): TPartialDeep<T> {
  return (
    TypeGuard.IsIntersect(schema)
      ? Type.Intersect(PartialDeepRest(schema.allOf))
      : TypeGuard.IsUnion(schema)
        ? Type.Union(PartialDeepRest(schema.anyOf))
        : TypeGuard.IsObject(schema)
          ? Type.Partial(Type.Object(PartialDeepProperties(schema.properties)))
          : schema
  ) as never
}
