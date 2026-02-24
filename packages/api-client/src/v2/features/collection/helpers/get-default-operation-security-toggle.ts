import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import type { AuthMeta } from '@scalar/workspace-store/events'

export const getDefaultOperationSecurityToggle = ({
  authStore,
  documentName,
  ...payload
}: {
  authStore: AuthStore
  documentName: string
} & AuthMeta) => {
  if (payload.type === 'document') {
    return false
  }

  if (!payload.path || !payload.method) {
    return undefined
  }

  return (
    authStore.getAuthSelectedSchemas({
      type: 'operation',
      documentName,
      path: payload.path,
      method: payload.method,
    }) !== undefined
  )
}
