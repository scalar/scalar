import type { Description } from '@/types'

/** Extracts the text from either Postman description format. */
export const normalizeDescription = (description?: Description): string | undefined => {
  if (typeof description === 'string') {
    return description
  }

  return description?.content
}
