/**
 * Re-export store composables from api-client for convenience
 * This allows components to use @/store instead of @scalar/api-client/store
 */
export { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
