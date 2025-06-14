import type { ReferenceObject } from '@/schemas/v3.1/strict/reference'

export const isReference = (value: unknown): value is ReferenceObject => {
  return typeof value === 'object' && value !== null && '$ref' in value
}
