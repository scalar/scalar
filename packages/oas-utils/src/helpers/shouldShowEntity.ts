import type { Request, Tag } from '@/entities/spec'

/**
 * Check if an entity should be ignored
 */
export const shouldIgnoreEntity = (
  entity:
    | undefined
    | Pick<Tag, 'x-internal' | 'x-scalar-ignore'>
    | Pick<Request, 'x-internal' | 'x-scalar-ignore'>,
) => {
  return entity?.['x-internal'] === true || entity?.['x-scalar-ignore'] === true
}

/**
 * Check if an entity should be hidden
 */
export const shouldShowEntity = ({
  tag,
  request,
}:
  | {
      tag?: never | undefined
      request?: Request
    }
  | {
      tag?: Tag
      request?: never | undefined
    }) => {
  if (tag) {
    return !shouldIgnoreEntity(tag)
  }

  if (request) {
    return !shouldIgnoreEntity(request)
  }

  return true
}
