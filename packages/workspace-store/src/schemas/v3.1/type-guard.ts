import type { ReferenceObject } from '@/schemas/v3.1/strict/reference'

/**
 * Type helper we can use if we have performed the isReference check higher in the stack
 */
export type Dereference<T> = T extends { $ref: string; '$ref-value'?: infer V } ? (V extends object ? V : never) : T

/** Type guard to check if a value is a reference */
export const isReference = (value: unknown): value is ReferenceObject =>
  typeof value === 'object' && value !== null && '$ref' in value

/** Type guard to check if a reference has been resolved */
export const isResolvedRef = <T>(value: unknown): value is Dereference<T> =>
  typeof value === 'object' && value !== null && !('$ref' in value)
