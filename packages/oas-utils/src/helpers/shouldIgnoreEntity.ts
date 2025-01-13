import type { Request, Tag } from '@/entities/spec'

/**
 * Check if an entity should be ignored
 */
export const shouldIgnoreEntity = (
  data:
    | undefined
    | Pick<Tag, 'x-internal' | 'x-scalar-ignore'>
    | Pick<Request, 'x-internal' | 'x-scalar-ignore'>,
) => {
  return data?.['x-internal'] === true || data?.['x-scalar-ignore'] === true
}
