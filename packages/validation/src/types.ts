import type {
  AnySchema,
  ArraySchema,
  BooleanSchema,
  EvaluateSchema,
  IntersectionSchema,
  LazySchema,
  LiteralSchema,
  NotDefinedSchema,
  NullableSchema,
  NumberSchema,
  ObjectSchema,
  OptionalSchema,
  RecordSchema,
  Schema,
  StringSchema,
  UnionSchema,
  UnknownSchema,
} from './schema'

// Export Static type with depth limit to prevent infinite recursion
export type Static<T> = _Static<T, 10>

/**
 * Folds intersection member schemas into an intersection of their static types.
 * Uses `Schema` for tuple positions (not a narrower alias) so `infer First extends …` does not
 * reject valid tuple elements and collapse to `{}`.
 */
type IntersectObjectStatics<Schemas extends readonly Schema[], Depth extends number> = Schemas extends readonly []
  ? {}
  : Schemas extends readonly [infer First extends Schema, ...infer Rest extends readonly Schema[]]
    ? _Static<First, Depth> & IntersectObjectStatics<Rest, Depth>
    : {}

type OptionalPropertyKeys<P> = {
  [K in keyof P]: P[K] extends OptionalSchema<any> ? K : never
}[keyof P]

type RequiredPropertyKeys<P> = {
  [K in keyof P]: P[K] extends OptionalSchema<any> ? never : K
}[keyof P]

type OptionalSchemaInner<S> = S extends OptionalSchema<infer Inner> ? Inner : never

type ObjectStatics<Properties, Depth extends number> = [keyof Properties] extends [never]
  ? {}
  : OptionalPropertyKeys<Properties> extends never
    ? { [K in keyof Properties]: _Static<Properties[K], Prev<Depth>> }
    : RequiredPropertyKeys<Properties> extends never
      ? { [K in OptionalPropertyKeys<Properties>]?: _Static<OptionalSchemaInner<Properties[K]>, Prev<Depth>> }
      : { [K in RequiredPropertyKeys<Properties>]: _Static<Properties[K], Prev<Depth>> } & {
          [K in OptionalPropertyKeys<Properties>]?: _Static<OptionalSchemaInner<Properties[K]>, Prev<Depth>>
        }

// Internal type with depth counter
type _Static<T, Depth extends number = 10> = Depth extends 0
  ? any
  : T extends LiteralSchema<infer Value>
    ? Value
    : T extends NumberSchema
      ? number
      : T extends StringSchema
        ? string
        : T extends BooleanSchema
          ? boolean
          : T extends NullableSchema
            ? null
            : T extends NotDefinedSchema
              ? undefined
              : T extends AnySchema
                ? any
                : T extends UnknownSchema
                  ? unknown
                  : T extends ArraySchema<infer Item>
                    ? Array<_Static<Item, Prev<Depth>>>
                    : T extends RecordSchema<infer Key, infer Value>
                      ? Record<_Static<Key, Prev<Depth>> & PropertyKey, _Static<Value, Prev<Depth>>>
                      : T extends ObjectSchema<infer Properties>
                        ? ObjectStatics<Properties, Depth>
                        : T extends OptionalSchema<infer S>
                          ? _Static<S, Prev<Depth>> | undefined
                          : T extends IntersectionSchema<infer Schemas>
                            ? IntersectObjectStatics<Schemas, Prev<Depth>>
                            : T extends UnionSchema<infer Schemas>
                              ? _Static<Schemas[number], Prev<Depth>>
                              : T extends EvaluateSchema<infer S>
                                ? _Static<S, Prev<Depth>>
                                : T extends LazySchema<infer S>
                                  ? _Static<ReturnType<S>, Prev<Depth>>
                                  : never

// Helper type to decrement depth counter
type Prev<T extends number> = T extends 10
  ? 9
  : T extends 9
    ? 8
    : T extends 8
      ? 7
      : T extends 7
        ? 6
        : T extends 6
          ? 5
          : T extends 5
            ? 4
            : T extends 4
              ? 3
              : T extends 3
                ? 2
                : T extends 2
                  ? 1
                  : T extends 1
                    ? 0
                    : 0
