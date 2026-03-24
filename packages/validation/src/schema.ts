/** Schema for finite numeric values. {@link Static} resolves to `number`. */
export type NumberSchema = {
  type: 'number'
}

/** Schema for string values. {@link Static} resolves to `string`. */
export type StringSchema = {
  type: 'string'
}

/** Schema for boolean values. {@link Static} resolves to `boolean`. */
export type BooleanSchema = {
  type: 'boolean'
}

/** Schema for `null`. {@link Static} resolves to `null`. */
export type NullableSchema = {
  type: 'nullable'
}

/** Schema for a missing or omitted value. {@link Static} resolves to `undefined`. */
export type NotDefinedSchema = {
  type: 'notDefined'
}

/** Schema that accepts any value without narrowing. {@link Static} resolves to `any`. */
export type AnySchema = {
  type: 'any'
}

/** Schema for homogeneous lists. {@link Static} resolves to an array of the item static type. */
export type ArraySchema<Item extends Schema> = {
  type: 'array'
  items: Item
}

/** Schema for key-value maps with uniform value shape. Keys are constrained to string or number schemas. */
export type RecordSchema<Key extends StringSchema | NumberSchema | AnySchema, Value extends Schema> = {
  type: 'record'
  key: Key
  value: Value
}

/** Schema for objects with a fixed set of named properties, each with its own schema. */
export type ObjectSchema<Properties extends Record<string, Schema>> = {
  type: 'object'
  properties: Properties
}

/** Schema that matches if any member schema matches (discriminated union when literals or object tags differ). */
export type UnionSchema<Schemas extends Schema[]> = {
  type: 'union'
  schemas: Schemas
}

/** Schema for a single exact constant (string, number, boolean, or bigint). {@link Static} is that literal type. */
export type LiteralSchema<T extends string | number | boolean | bigint> = {
  type: 'literal'
  value: T
}

/**
 * Schema for self-referential or recursive types (such as trees or linked lists).
 * The `schema` property is a factory function returning a schema instance, allowing
 * references to itself without causing circular definition errors at type-level.
 */
export type LazySchema<S extends () => Schema> = {
  type: 'lazy'
  schema: S
}

/**
 * Schema that runs a coercion or transform (`expression`) on the input, then validates with the inner schema.
 * Use when parsing needs a preprocessing step before the usual rules apply.
 */
export type EvaluateSchema<S extends Schema> = {
  type: 'evaluate'
  expression: (value: unknown) => unknown
  schema: S
}

export type Schema =
  | NumberSchema
  | StringSchema
  | BooleanSchema
  | NullableSchema
  | NotDefinedSchema
  | AnySchema
  | ArraySchema<any>
  | RecordSchema<any, any>
  | ObjectSchema<Record<string, any>>
  | UnionSchema<any[]>
  | LiteralSchema<any>
  | LazySchema<any>
  | EvaluateSchema<any>

const number = (): NumberSchema => ({
  type: 'number',
})

const string = (): StringSchema => ({
  type: 'string',
})

const boolean = (): BooleanSchema => ({
  type: 'boolean',
})

const nullable = (): NullableSchema => ({
  type: 'nullable',
})

const notDefined = (): NotDefinedSchema => ({
  type: 'notDefined',
})

const any = (): AnySchema => ({
  type: 'any',
})

const array = <Item extends Schema>(items: Item): ArraySchema<Item> => ({
  type: 'array',
  items,
})

const record = <Key extends StringSchema | AnySchema, Value extends Schema>(
  key: Key,
  value: Value,
): RecordSchema<Key, Value> => ({
  type: 'record',
  key,
  value,
})

const object = <Properties extends Record<string, Schema>>(properties: Properties): ObjectSchema<Properties> => ({
  type: 'object',
  properties,
})

const union = <Schemas extends Schema[]>(schemas: Schemas): UnionSchema<Schemas> => ({
  type: 'union',
  schemas,
})

const optional = <S extends Schema>(schema: S) => union([schema, notDefined()])

const literal = <Value extends string | number | boolean | bigint>(value: Value): LiteralSchema<Value> => ({
  type: 'literal',
  value,
})

const lazy = <S extends () => Schema>(schema: S): LazySchema<S> => ({
  type: 'lazy',
  schema,
})

const evaluate = <S extends Schema>(expression: (value: unknown) => unknown, schema: S): EvaluateSchema<S> => ({
  type: 'evaluate',
  expression,
  schema,
})

export {
  number,
  string,
  boolean,
  nullable,
  notDefined,
  any,
  array,
  record,
  object,
  union,
  optional,
  literal,
  lazy,
  evaluate,
}
