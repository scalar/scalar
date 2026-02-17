import type { HttpMethod } from '@scalar/helpers/http/http-methods'

import type { WorkspaceStore } from '@/client'
import { canHaveOrder, getOpenapiObject } from '@/navigation/helpers/get-openapi-object'
import type { IdGenerator, TraversedOperation, TraversedTag, TraversedWebhook, WithParent } from '@/schemas/navigation'
import type { TagObject } from '@/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@/schemas/v3.1/strict/operation'

type UpdateOrderIdParams = {
  store: WorkspaceStore
  generateId: IdGenerator
} & (
  | {
      /** Operation or webhook entries to update the order ID for */
      entries: (WithParent<TraversedOperation> | WithParent<TraversedWebhook>)[]
      operation: OperationObject
      method: HttpMethod
      path: string
    }
  | {
      /** Tag entries to update the order ID for */
      entries: WithParent<TraversedTag>[]
      tag: TagObject
    }
)

/**
 * Updates the order ID of an entry (operation or tag) in the sidebar.
 * Used when changing path, method, or tag name so we do not lose the sidebar ordering.
 *
 * Accepts either operation/webhook entries or tag entries via a discriminated union,
 * so the correct ID generation props are enforced at the call site.
 */
export const updateOrderIds = ({ store, generateId, ...rest }: UpdateOrderIdParams) => {
  // Loop over the entries and replace the ID in the x-scalar-order with the new ID
  rest.entries?.forEach((entry) => {
    if (!canHaveOrder(entry.parent)) {
      return
    }

    // Ensure we have an x-scalar-order property
    const parentOpenAPIObject = getOpenapiObject({ store, entry: entry.parent })
    if (!parentOpenAPIObject || !('x-scalar-order' in parentOpenAPIObject)) {
      return
    }

    const order = parentOpenAPIObject['x-scalar-order']
    const index = order?.indexOf(entry.id)
    if (!Array.isArray(order) || typeof index !== 'number' || index < 0) {
      return
    }

    // Tag entries: generate a new tag ID using the updated tag object
    if ('tag' in rest) {
      order[index] = generateId({
        type: 'tag',
        parentId: entry.parent.id,
        tag: rest.tag,
      })
      return
    }

    // Operation/webhook entries: generate a new operation ID with the updated path and method
    const parentTag =
      entry.parent.type === 'tag' && 'name' in parentOpenAPIObject
        ? { tag: parentOpenAPIObject, id: entry.parent.id }
        : undefined

    order[index] = generateId({
      type: 'operation',
      path: rest.path,
      method: rest.method,
      operation: rest.operation,
      parentId: entry.parent.id,
      parentTag,
    })
  })
}
