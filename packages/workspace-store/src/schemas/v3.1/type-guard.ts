import type { ReferenceObject } from '@/schemas/v3.1/strict/reference'

/** Type guard to check if a value is a reference */
export const isReference = (value: unknown): value is ReferenceObject =>
  typeof value === 'object' && value !== null && '$ref' in value

/**
 * Type helper we can use if we have performed the isReference check higher in the stack
 */
export type Dereference<T> = Exclude<T, ReferenceObject>
