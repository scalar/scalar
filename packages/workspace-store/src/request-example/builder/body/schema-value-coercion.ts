import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

/** Normalize a schema's `type` (string | string[] | absent) into a plain string array. */
export const normalizeSchemaTypes = (schema: SchemaObject): string[] => {
  const type = 'type' in schema ? schema.type : undefined
  return Array.isArray(type) ? [...type] : type == null ? [] : [type]
}

/**
 * Walk an object schema along a dotted-row path and return the resolved leaf schema,
 * or undefined when any segment is not a declared object property.
 */
export const resolveLeafSchema = (schema: SchemaObject | undefined, segments: string[]): SchemaObject | undefined => {
  let current = schema
  for (const segment of segments) {
    if (!current || !isObjectSchema(current) || !current.properties) {
      return undefined
    }
    current = getResolvedRef(current.properties[segment], mergeSiblingReferences) as SchemaObject | undefined
  }
  return current
}

/** True when a JSON-parsed value's runtime type is allowed by the schema's declared types. */
export const parsedValueMatchesSchemaType = (value: unknown, types: string[]): boolean => {
  if (value === null) {
    return types.includes('null')
  }
  if (Array.isArray(value)) {
    return types.includes('array')
  }
  if (typeof value === 'object') {
    return types.includes('object')
  }
  if (typeof value === 'boolean') {
    return types.includes('boolean')
  }
  if (typeof value === 'number') {
    // A fractional value only satisfies `number`; `integer` requires a whole number so a
    // string like "3.14" against an integer-only leaf stays untouched instead of being coerced.
    return types.includes('number') || (types.includes('integer') && Number.isInteger(value))
  }
  if (typeof value === 'string') {
    return types.includes('string')
  }
  return false
}

/**
 * The form table stringifies every value for display, so an edited nested field comes back
 * as a string (`false` -> "false", `[]` -> "[]"). When the leaf schema declares a non-string
 * type, parse the string back to that type so the regrouped JSON part keeps its original
 * shape instead of becoming string-typed (issue #9416).
 *
 * Coercion is deliberately conservative: schemas that allow `string` keep the raw text, and a
 * value that does not parse as its declared type is left untouched so user input is never lost.
 */
export const coerceLeafValueToSchemaType = (value: unknown, schema: SchemaObject | undefined): unknown => {
  if (typeof value !== 'string' || !schema) {
    return value
  }
  const types = normalizeSchemaTypes(schema)
  // No declared type, or a string is allowed: keep the user's text as-is.
  if (types.length === 0 || types.includes('string')) {
    return value
  }
  try {
    const parsed = JSON.parse(value)
    return parsedValueMatchesSchemaType(parsed, types) ? parsed : value
  } catch {
    return value
  }
}

/**
 * Best-effort coercion for row values whose property is not declared in the schema.
 *
 * Without a declared type we have no authority to keep `"5"` a string, and leaving it
 * untouched would string-type every undeclared number/boolean on the first form edit.
 * So values that parse as non-string JSON (`5`, `true`, `null`, `[1]`, `{"a":1}`) become
 * that value, and anything else stays the raw text the user typed.
 */
export const coerceUntypedValue = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value
  }
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'string' ? value : parsed
  } catch {
    return value
  }
}

/**
 * Build a predicate that recognizes rows whose dotted name encodes a path into a nested
 * object property of the body schema. Without a schema (or when the dotted prefix is not
 * declared as a nested object), a row like `user.email` is treated as a literal name and
 * stays flat — only schema-derived leaves emitted by the form-row builders are folded
 * back into nested objects.
 */
export const buildDottedNestedRowPredicate = (schema: unknown) => {
  const resolved = schema ? (getResolvedRef(schema, mergeSiblingReferences) as SchemaObject | undefined) : undefined
  if (!resolved || !isObjectSchema(resolved) || !resolved.properties) {
    return (_name: string, _value: unknown) => false
  }
  const nestedTopKeys = new Set<string>()
  for (const [key, child] of Object.entries(resolved.properties)) {
    const childResolved = child
      ? (getResolvedRef(child, mergeSiblingReferences) as SchemaObject | undefined)
      : undefined
    if (childResolved && isObjectSchema(childResolved) && childResolved.properties) {
      nestedTopKeys.add(key)
    }
  }
  return (name: string, value: unknown) => {
    if (value instanceof File || !name.includes('.')) {
      return false
    }
    const head = name.split('.', 1)[0]
    return !!head && nestedTopKeys.has(head)
  }
}
