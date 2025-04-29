// TODO: Replace with a Webhook schema from the store (once it exists)
import type { Webhook } from '@scalar/types/legacy'

import type { Request } from '@/entities/spec/requests'
import type { Tag } from '@/entities/spec/spec-objects'

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
