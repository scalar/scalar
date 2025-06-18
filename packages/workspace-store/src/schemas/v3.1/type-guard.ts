import type { ReferenceObject } from '@/schemas/v3.1/strict/reference'

export const isReference = (value: unknown): value is ReferenceObject => {
  return typeof value === 'object' && value !== null && '$ref' in value
}

/**
 * Type helper we can use if we have performed the isReference check higher in the stack
 */
export type Dereference<T> = Exclude<T, ReferenceObject>
