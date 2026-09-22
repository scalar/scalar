/**
 * Represents an object with string keys and unknown values.
 * Useful for handling objects with dynamic or unknown value types.
 */
export type UnknownObject = Record<string, unknown>

/**
 * Represents an object with string keys and values of any type.
 * Prefer {@link UnknownObject} where possible; use this only when values are
 * genuinely untyped and narrowing at every access site would be impractical.
 */
export type AnyObject = Record<string, any>
