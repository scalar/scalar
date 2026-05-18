/**
 * Optional metadata for type generation and documentation.
 * - typeName: Used as the exported TypeScript type name if valid.
 * - typeComment: Adds a JSDoc comment to the generated type declaration.
 */
type Documentation = Partial<{
  /** Adds a JSDoc comment to the generated type declaration. */
  typeComment: string
  /** Used as the exported TypeScript type name if valid. */
  typeName: string
}>

/** Schema for finite numeric values. {@link Static} resolves to `number`. */
export type NumberSchema = {
  type: 'number'
  default?: number
} & Documentation

/** Schema for string values. {@link Static} resolves to `string`. */
export type StringSchema = {
  type: 'string'
  default?: string
} & Documentation

/** Schema for boolean values. {@link Static} resolves to `boolean`. */
export type BooleanSchema = {
  type: 'boolean'
  default?: boolean
} & Documentation

/** Schema for `null`. {@link Static} resolves to `null`. */
export type NullableSchema = {
  type: 'nullable'
} & Documentation

/** Schema for a missing or omitted value. {@link Static} resolves to `undefined`. */
export type NotDefinedSchema = {
  type: 'notDefined'
} & Documentation

/** Schema that accepts any value without narrowing. {@link Static} resolves to `any`. */
export type AnySchema = {
  type: 'any'
} & Documentation

/** Schema that accepts any value. {@link Static} resolves to `unknown` instead of `any`. */
export type UnknownSchema = {
  type: 'unknown'
} & Documentation

/**
 * Schema for function values. Validates only that the value is `typeof === 'function'`.
 * The type parameter `T` carries the full function signature for {@link Static} inference
 * but is never checked at runtime.
 */
export type FunctionSchema<T extends (...args: any[]) => any = (...args: unknown[]) => unknown> = {
  type: 'function'
  /** Phantom field — never set at runtime. Carries `T` so that `Static` can extract it. */
  _fn?: T
} & Documentation

/** Schema for homogeneous lists. {@link Static} resolves to an array of the item static type. */
export type ArraySchema<Item extends Schema> = {
  type: 'array'
  items: Item
} & Documentation

/** Schema for key-value maps with uniform value shape. Keys are constrained to string or number schemas. */
export type RecordSchema<Key extends StringSchema | NumberSchema | AnySchema, Value extends Schema> = {
  type: 'record'
  key: Key
  value: Value
} & Documentation

/** Schema for objects with a fixed set of named properties, each with its own schema. */
export type ObjectSchema<Properties extends Record<string, Schema>> = {
  type: 'object'
  properties: Properties
} & Documentation

/** Schema that matches if any member schema matches (discriminated union when literals or object tags differ). */
export type UnionSchema<Schemas extends readonly Schema[]> = {
  type: 'union'
  schemas: Schemas
} & Documentation

/**
 * Members that may appear inside a `union([...])`.
 *
 * Discriminant-only for the same reason as {@link IntersectionMember}: a full `Schema` constraint
 * at the call site forces TypeScript to eagerly evaluate tuple elements and breaks circular
 * inference when members use `lazy(() => self)` (for example recursive navigation trees).
 */
export type UnionMember =
  | { type: 'object' }
  | { type: 'union' }
  | { type: 'intersection' }
  | { type: 'lazy' }
  | { type: 'literal' }
  | { type: 'number' }
  | { type: 'string' }
  | { type: 'boolean' }
  | { type: 'nullable' }
  | { type: 'notDefined' }
  | { type: 'any' }
  | { type: 'unknown' }
  | { type: 'function' }
  | { type: 'array' }
  | { type: 'record' }
  | { type: 'evaluate' }

/**
 * Schema that accepts `undefined` or a value matching the inner schema.
 * In {@link Static} and type generation, object properties use `key?:` instead of `T | undefined`.
 */
export type OptionalSchema<S extends Schema> = {
  type: 'optional'
  schema: S
} & Documentation

/**
 * Members that may appear inside an `intersection([...])`.
 *
 * This is intentionally a discriminant-only structural type rather than a union of the full
 * schema types. If we use the full schema types here, the constraint check at the call site
 * of `intersection` forces TypeScript to *eagerly* evaluate each tuple element, which breaks
 * circular type inference when a member transitively contains a `lazy(() => self)` reference.
 *
 * The narrower discriminant shape only requires TypeScript to verify the `type` literal, which
 * is cheap and does not trigger evaluation of nested schemas. Every `ObjectSchema`, `UnionSchema`,
 * `IntersectionSchema`, and `LazySchema` is still assignable to this type because each carries
 * the appropriate `type` field, so the public API and compile-time safety are preserved.
 */
export type IntersectionMember = { type: 'object' } | { type: 'union' } | { type: 'intersection' } | { type: 'lazy' }

export type IntersectionSchema<Schemas extends readonly Schema[]> = {
  type: 'intersection'
  schemas: Schemas
} & Documentation

/** Schema for a single exact constant (string, number, boolean, or bigint). {@link Static} is that literal type. */
export type LiteralSchema<T extends string | number | boolean | bigint> = {
  type: 'literal'
  value: T
} & Documentation

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
  | UnknownSchema
  | FunctionSchema<any>
  | ArraySchema<any>
  | RecordSchema<any, any>
  | ObjectSchema<Record<string, any>>
  | UnionSchema<readonly Schema[]>
  | OptionalSchema<any>
  | IntersectionSchema<readonly Schema[]>
  | LiteralSchema<any>
  | LazySchema<any>
  | EvaluateSchema<any>

const number = (options?: Documentation & { default?: number }): NumberSchema => ({
  type: 'number',
  default: options?.default,
  typeName: options?.typeName,
  typeComment: options?.typeComment,
})

const string = (options?: Documentation & { default?: string }): StringSchema => ({
  type: 'string',
  default: options?.default,
  typeName: options?.typeName,
  typeComment: options?.typeComment,
})

const boolean = (options?: Documentation & { default?: boolean }): BooleanSchema => ({
  type: 'boolean',
  default: options?.default,
  typeName: options?.typeName,
  typeComment: options?.typeComment,
})

const nullable = (options?: Documentation): NullableSchema => ({
  type: 'nullable',
  typeName: options?.typeName,
  typeComment: options?.typeComment,
})

const notDefined = (options?: Documentation): NotDefinedSchema => ({
  type: 'notDefined',
  typeName: options?.typeName,
  typeComment: options?.typeComment,
})

const any = (options?: Documentation): AnySchema => ({
  type: 'any',
  typeName: options?.typeName,
  typeComment: options?.typeComment,
})

const unknown = (options?: Documentation): UnknownSchema => ({
  type: 'unknown',
  typeName: options?.typeName,
  typeComment: options?.typeComment,
})

const fn = <T extends (...args: any[]) => any = (...args: unknown[]) => unknown>(
  options?: Documentation,
): FunctionSchema<T> => ({
  type: 'function',
  typeName: options?.typeName,
  typeComment: options?.typeComment,
})

const array = <Item extends Schema>(items: Item, options?: Documentation): ArraySchema<Item> => ({
  type: 'array',
  items,
  typeName: options?.typeName,
  typeComment: options?.typeComment,
})

const record = <Key extends StringSchema | AnySchema, Value extends Schema>(
  key: Key,
  value: Value,
  options?: Documentation,
): RecordSchema<Key, Value> => ({
  type: 'record',
  key,
  value,
  typeName: options?.typeName,
  typeComment: options?.typeComment,
})

const object = <Properties extends Record<string, Schema>>(
  properties: Properties,
  options?: Documentation,
): ObjectSchema<Properties> => ({
  type: 'object',
  properties,
  typeName: options?.typeName,
  typeComment: options?.typeComment,
})

/**
 * The conditional return type mirrors {@link intersection}: lightweight input constraint,
 * precise `UnionSchema<Schemas>` output without re-triggering eager evaluation.
 */
const union = <const Schemas extends readonly UnionMember[]>(
  schemas: Schemas,
  options?: Documentation,
): Schemas extends readonly Schema[] ? UnionSchema<Schemas> : never =>
  ({
    type: 'union',
    schemas,
    typeName: options?.typeName,
    typeComment: options?.typeComment,
  }) as never

/**
 * The conditional return type is what unlocks circular `intersection([... lazy(() => self) ...])`.
 *
 * The input constraint is the lightweight `IntersectionMember` (discriminant-only) so the call-site
 * constraint check does not force TypeScript to eagerly evaluate each tuple element. The conditional
 * `Schemas extends readonly Schema[]` is always true in practice (every passed value is a real schema)
 * and lets us produce a precise `IntersectionSchema<Schemas>` without re-introducing the heavy check.
 */
const intersection = <const Schemas extends readonly IntersectionMember[]>(
  schemas: Schemas,
  options?: Documentation,
): Schemas extends readonly Schema[] ? IntersectionSchema<Schemas> : never =>
  ({
    type: 'intersection',
    schemas,
    typeName: options?.typeName,
    typeComment: options?.typeComment,
  }) as never

const optional = <S extends Schema>(schema: S, options?: Documentation): OptionalSchema<S> => ({
  type: 'optional',
  schema,
  typeName: options?.typeName,
  typeComment: options?.typeComment,
})

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
  unknown,
  fn,
  array,
  record,
  object,
  union,
  intersection,
  optional,
  literal,
  lazy,
  evaluate,
}
