import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import { effectScope } from 'vue'

import { createReferenceDocumentLoader } from '@/helpers/create-reference-document-loader'
import { normalizeConfigurations } from '@/helpers/normalize-configurations'
import { useDocumentEnvironment } from '@/helpers/use-document-environment'
import { withLocalizedConfigurationDefaults } from '@/helpers/with-localized-configuration-defaults'
import { useConfiguredServers } from '@/hooks/use-configured-servers'

/** Initial document state, prepared independently for each server render or client hydration. */
export type PreparedApiReference = {
  /** The server's default document; browser navigation is applied after hydration. */
  slug: string
  workspace: ReturnType<WorkspaceStore['exportWorkspace']>
  clientWorkspace: ReturnType<WorkspaceStore['exportWorkspace']>
}

/**
 * Fetch and bundle the initial document before mounting a server-rendered reference.
 * Pass the result as ApiReference's prepared prop on the client. Preparation does not
 * touch the DOM or invoke lifecycle callbacks, so the server HTML remains readable
 * while loading and an unsuccessful preparation can leave it intact.
 */
export const prepareApiReference = async (
  configuration: AnyApiReferenceConfiguration,
): Promise<PreparedApiReference> => {
  const configurations = normalizeConfigurations(configuration)
  const slug =
    Object.values(configurations).find((config) => config.default)?.slug ?? Object.keys(configurations)[0] ?? ''
  const workspaceStore = createWorkspaceStore()
  const clientStore = createWorkspaceStore()
  // Preparation is temporary; stop its synchronization watchers once the snapshot is ready.
  const scope = effectScope()
  scope.run(() => {
    useDocumentEnvironment(workspaceStore)
    useDocumentEnvironment(clientStore)
    useConfiguredServers({ configurations: () => configurations, sourceStore: workspaceStore, clientStore })
  })
  try {
    const { ensureDocumentLoaded } = createReferenceDocumentLoader({
      workspaceStore,
      clientStore,
      getConfigurations: () => configurations,
      getConfiguration: ({ config }) => withLocalizedConfigurationDefaults(config),
    })

    const loaded = await ensureDocumentLoaded(slug)
    if (slug && !loaded) {
      throw new Error(`Could not prepare API reference document "${slug}" for hydration`)
    }
    workspaceStore.update('x-scalar-active-document', slug)
    clientStore.update('x-scalar-active-document', slug)

    return {
      slug,
      workspace: workspaceStore.exportWorkspace(),
      clientWorkspace: clientStore.exportWorkspace(),
    }
  } finally {
    scope.stop()
  }
}
