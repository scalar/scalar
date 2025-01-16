import type { Request, Tag } from '@/entities/spec'
// TODO: Replace with a Webhook schema from the store (once it exists)
import type { Webhook } from '@scalar/types/legacy'

/**
 * Check if an entity should be ignored
 */
export const shouldIgnoreEntity = (
  data:
    | undefined
    | Pick<Tag, 'x-internal' | 'x-scalar-ignore'>
    | Pick<Request, 'x-internal' | 'x-scalar-ignore'>
    | Pick<Webhook, 'x-internal' | 'x-scalar-ignore'>,
) => {
  return data?.['x-internal'] === true || data?.['x-scalar-ignore'] === true
}
