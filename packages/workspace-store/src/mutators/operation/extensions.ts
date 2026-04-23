import type { OperationEvents } from '@/events'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { mergeObjects } from '@/helpers/merge-object'
import type { WorkspaceDocument } from '@/schemas'
import { isOpenApiDocument } from '@/schemas/type-guards'

/**
 * Updates an extension of the operation
 *
 * @example
 * ```ts
 * updateOperationExtension({
 *   document,
 *   meta: { method: 'get', path: '/users' },
 *   payload: { 'x-post-response': 'console.log(response)' },
 * })
 * ```
 */
export const updateOperationExtension = (
  document: WorkspaceDocument | null,
  { meta, payload }: OperationEvents['operation:update:extension'],
) => {
  if (!isOpenApiDocument(document)) {
    return
  }
  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    return
  }

  mergeObjects(operation, payload)
}
