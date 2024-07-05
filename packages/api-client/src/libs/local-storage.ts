import type { useWorkspace } from '@/store/workspace'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import type { Collection } from '@scalar/oas-utils/entities/workspace/collection'
import type { Cookie } from '@scalar/oas-utils/entities/workspace/cookie'
import type { Environment } from '@scalar/oas-utils/entities/workspace/environment'
import type { Folder } from '@scalar/oas-utils/entities/workspace/folder'
import type { SecurityScheme } from '@scalar/oas-utils/entities/workspace/security'
import type { Server } from '@scalar/oas-utils/entities/workspace/server'
import type {
  Request,
  RequestExample,
} from '@scalar/oas-utils/entities/workspace/spec'
import { LS_KEYS } from '@scalar/object-utils/mutator-record'

/**
 * Loads all resources from localStorage into mutators on app start
 * We use the raw mutator.add here instead of the custom ones because we do NOT want any side effects
 *
 * Currently not working for workspace
 */
export const loadAllResources = (
  mutators: ReturnType<typeof useWorkspace>,
  workspaceUid = 'default',
) => {
  const {
    collectionMutators,
    cookieMutators,
    environmentMutators,
    folderMutators,
    requestExampleMutators,
    requestMutators,
    serverMutators,
    securitySchemeMutators,
    workspaceMutators,
  } = mutators

  // Collections
  const collections = Object.values(
    JSON.parse(localStorage.getItem(LS_KEYS.COLLECTION) || '{}'),
  ) as Collection[]
  collections.forEach(collectionMutators.rawAdd)

  // Cookies
  const cookies = Object.values(
    JSON.parse(localStorage.getItem(LS_KEYS.COOKIE) || '{}'),
  ) as Cookie[]
  cookies.forEach(cookieMutators.add)

  // Environments
  const environments = Object.values(
    JSON.parse(localStorage.getItem(LS_KEYS.ENVIRONMENT) || '{}'),
  ) as Environment[]
  environments.forEach(environmentMutators.add)

  // Folders
  const folders = Object.values(
    JSON.parse(localStorage.getItem(LS_KEYS.FOLDER) || '{}'),
  ) as Folder[]
  folders.forEach(folderMutators.rawAdd)

  // Request Examples
  const requestExamples = Object.values(
    JSON.parse(localStorage.getItem(LS_KEYS.REQUEST_EXAMPLE) || '{}'),
  ) as RequestExample[]
  requestExamples.forEach(requestExampleMutators.rawAdd)

  // Requests
  const requests = Object.values(
    JSON.parse(localStorage.getItem(LS_KEYS.REQUEST) || '{}'),
  ) as Request[]
  requests.forEach(requestMutators.rawAdd)

  // Servers
  const servers = Object.values(
    JSON.parse(localStorage.getItem(LS_KEYS.SERVER) || '{}'),
  ) as Server[]
  servers.forEach(serverMutators.rawAdd)

  // Security Schemes
  const securitySchemes = Object.values(
    JSON.parse(localStorage.getItem(LS_KEYS.SECURITY_SCHEME) || '{}'),
  ) as SecurityScheme[]
  securitySchemes.forEach(securitySchemeMutators.add)

  // Workspace
  const workspaces = Object.values(
    JSON.parse(localStorage.getItem(LS_KEYS.WORKSPACE + workspaceUid) || '{}'),
  ) as Workspace[]
  workspaces.forEach(workspaceMutators.add)
}
