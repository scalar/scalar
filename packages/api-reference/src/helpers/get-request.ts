import type { WorkspaceStore } from '@scalar/api-client/store'

/** Grabs the request from a path + method */
export const getRequest = (
  requests: WorkspaceStore['requests'],
  path: string,
  method: string,
) =>
  Object.values(requests).find(
    (r) => r.path === path && r.method.toLowerCase() === method.toLowerCase(),
  )
