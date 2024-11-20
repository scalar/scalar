import type { EnvVariables } from '@scalar/api-client/libs'
import {
  type WorkspaceStore,
  defaultRouterParamsFactory,
} from '@scalar/api-client/store'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { computed } from 'vue'

/**
 * Generate a store of active entities for the auth component
 *
 * We can select them correctly as we needed
 */
export const createActiveEntitiesStore = (store: WorkspaceStore) => ({
  activeCollection: computed(() => Object.values(store.collections)[0]),
  activeEnvVariables: computed<EnvVariables>(() => []),
  activeEnvironment: computed<Environment>(() => ({
    value: '',
    uid: '',
    name: '',
    color: '',
  })),
  activeCookieId: computed(() => ''),
  activeExample: computed(() => Object.values(store.requestExamples)[0]),
  activeRequest: computed(() => Object.values(store.requests)[0]),
  activeRouterParams: computed(() => defaultRouterParamsFactory()),
  activeServer: computed(() => Object.values(store.servers)[0]),
  activeWorkspace: computed(() => Object.values(store.workspaces)[0]),
  activeWorkspaceCollections: computed(() => Object.values(store.collections)),
  activeWorkspaceServers: computed(() => Object.values(store.servers)),
  activeWorkspaceRequests: computed(() => Object.values(store.requests)),
  router,
})
