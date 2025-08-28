import type { Collection, Operation } from '@scalar/oas-utils/entities/spec'

/**
 * Checks if the user gets the getting started state displayed
 */
export const isGettingStarted = (
  activeWorkspaceCollections: Collection[],
  activeWorkspaceRequests: Operation['uid'][],
  requests: Record<string, any>,
) => {
  const draftCollection = activeWorkspaceCollections.find((collection) => collection.info?.title === 'Drafts')
  const hasSingleRequest = activeWorkspaceRequests.length === 1

  if (!activeWorkspaceRequests[0]) {
    return false
  }
  const isDraftsRequest = draftCollection?.requests.includes(activeWorkspaceRequests[0])

  if (!isDraftsRequest) {
    return false
  }
  const isRenamed = requests[draftCollection?.requests[0] ?? '']?.summary !== 'My First Request'

  return hasSingleRequest && isDraftsRequest && !isRenamed
}
