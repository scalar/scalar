import type { useWorkspace } from '@/store'
import { DATA_VERSION, migrator } from '@scalar/oas-utils/migrations'

/**
 * Loads all resources from localStorage and applies any migrations, then loads into mutators
 * We use the raw mutator.add here instead of the custom ones because we do NOT want any side effects
 *
 * Currently not working for workspace
 */
export const loadAllResources = (mutators: ReturnType<typeof useWorkspace>) => {
  const {
    collectionMutators,
    cookieMutators,
    environmentMutators,
    tagMutators,
    requestExampleMutators,
    requestMutators,
    serverMutators,
    securitySchemeMutators,
    workspaceMutators,
  } = mutators

  try {
    // Hit our local storage data migrator
    const {
      collections,
      cookies,
      environments,
      requestExamples,
      requests,
      servers,
      securitySchemes,
      tags,
      workspaces,
    } = migrator()

    // We run through schemaModel out here since we will only have the most current models
    collectionMutators.loadLocalStorage(collections)
    cookieMutators.loadLocalStorage(cookies)
    environmentMutators.loadLocalStorage(environments)
    requestExampleMutators.loadLocalStorage(requestExamples)
    requestMutators.loadLocalStorage(requests)
    serverMutators.loadLocalStorage(servers)
    securitySchemeMutators.loadLocalStorage(securitySchemes)
    tagMutators.loadLocalStorage(tags)
    workspaceMutators.loadLocalStorage(workspaces)

    // Set localStorage version for future migrations
    localStorage.setItem('version', DATA_VERSION)
  } catch (e) {
    console.error(e)
  }
}
