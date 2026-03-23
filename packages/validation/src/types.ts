import type {
  AnySchema,
  ArraySchema,
  BooleanSchema,
  EvaluateSchema,
  LiteralSchema,
  NotDefinedSchema,
  NullableSchema,
  NumberSchema,
  ObjectSchema,
  RecordSchema,
  RecursiveSchema,
  StringSchema,
  UnionSchema,
} from './schema'

// Export Static type with depth limit to prevent infinite recursion
export type Static<T> = _Static<T, 10>

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
                : T extends ArraySchema<infer Item>
                  ? Array<_Static<Item, Prev<Depth>>>
                  : T extends RecordSchema<infer Key, infer Value>
                    ? Record<_Static<Key, Prev<Depth>> & PropertyKey, _Static<Value, Prev<Depth>>>
                    : T extends ObjectSchema<infer Properties>
                      ? { [K in keyof Properties]: _Static<Properties[K], Prev<Depth>> }
                      : T extends UnionSchema<infer Schemas>
                        ? _Static<Schemas[number], Prev<Depth>>
                        : T extends EvaluateSchema<infer S>
                          ? _Static<S, Prev<Depth>>
                          : T extends RecursiveSchema<infer S>
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
