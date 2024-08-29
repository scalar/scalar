import type { useWorkspace } from '@/store'

/**
 * Loads all resources from localStorage into mutators on app start
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
    collectionMutators.loadLocalStorage()
    cookieMutators.loadLocalStorage()
    environmentMutators.loadLocalStorage()
    tagMutators.loadLocalStorage()
    requestExampleMutators.loadLocalStorage()
    requestMutators.loadLocalStorage()
    serverMutators.loadLocalStorage()
    securitySchemeMutators.loadLocalStorage()
    workspaceMutators.loadLocalStorage()

    // Set localStorage version for future migrations
    localStorage.setItem('version', import.meta.env.PACKAGE_VERSION)
  } catch (e) {
    console.error(e)
    return e
  }
}
