import type { Operation } from '@/entities/specification'
import type { Tag } from '@/entities/specification/tag-object'
// TODO: Replace with a Webhook schema from the store (once it exists)
import type { Webhook } from '@scalar/types/legacy'

/**
 * Check if an entity should be ignored
 */
export const shouldIgnoreEntity = (
  data:
    | undefined
    | Pick<Tag, 'x-internal' | 'x-scalar-ignore'>
    | Pick<Operation, 'x-internal' | 'x-scalar-ignore'>
    | Pick<Webhook, 'x-internal' | 'x-scalar-ignore'>,
) => {
  return data?.['x-internal'] === true || data?.['x-scalar-ignore'] === true
}
