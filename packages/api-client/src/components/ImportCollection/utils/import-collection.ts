import type { Collection } from '@scalar/oas-utils/entities/spec'

import { isUrl } from '@/components/ImportCollection/utils/is-url'
import type { WorkspaceStore } from '@/store'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'

export async function importCollection({
  store,
  workspace,
  source,
  watchMode,
  onSuccess,
  onError,
}: {
  store: WorkspaceStore
  workspace: Workspace | undefined
  source: string | null | undefined
  watchMode: boolean
  onSuccess: (collection: Collection | undefined) => void
  onError: (error: Error) => void
}) {
  try {
    if (source && workspace) {
      if (isUrl(source)) {
        const [error, entities] = await store.importSpecFromUrl(source, workspace.uid, {
          proxyUrl: workspace.proxyUrl,
          watchMode: watchMode,
        })

        if (!error) {
          onSuccess(entities?.collection)
        }

        return
      }

      const entities = await store.importSpecFile(source, workspace.uid)

      onSuccess(entities?.collection)
    }
  } catch (error) {
    onError(error as Error)
  }
}
