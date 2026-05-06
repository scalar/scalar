import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import type { AuthMeta } from '@scalar/workspace-store/events'

/**
 * Determines the default toggle state for operation security.
 * Returns false for 'document' type, undefined if path/method is missing,
 * otherwise checks if there are selected auth schemas for the operation.
 */
export const getDefaultOperationSecurityToggle = ({
  authStore,
  documentName,
  ...payload
}: {
  authStore: AuthStore
  documentName: string
} & AuthMeta) => {
  // If the payload type is 'document', security toggle should be off by default
  if (payload.type === 'document') {
    return false
  }

  // Check if there are any selected authentication schemas for this operation
  return (
    authStore.getAuthSelectedSchemas({
      type: 'operation',
      documentName,
      path: payload.path,
      method: payload.method,
    }) !== undefined
  )
}
