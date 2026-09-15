import { type AnyApiReferenceConfiguration, DEFAULT_MODELS_SECTION_LABEL } from '@scalar/types/api-reference'
import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'

import { resolveLocalization } from '@/features/localization'
import { createReferenceDocumentLoader } from '@/helpers/create-reference-document-loader'
import { normalizeConfigurations } from '@/helpers/normalize-configurations'

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
  const { ensureDocumentLoaded } = createReferenceDocumentLoader({
    workspaceStore,
    clientStore,
    getConfigurations: () => configurations,
    getConfiguration: ({ config }) => ({
      ...config,
      modelsSectionLabel:
        config.modelsSectionLabel !== DEFAULT_MODELS_SECTION_LABEL
          ? config.modelsSectionLabel
          : (resolveLocalization(config.localization).translations.models.label ?? DEFAULT_MODELS_SECTION_LABEL),
    }),
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
}
