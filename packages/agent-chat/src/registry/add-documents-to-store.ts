import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { Ref } from 'vue'

import type { Api } from '@/api'
import type { ApiMetadata } from '@/entities/registry/document'
import { restoreAuthSecretsFromStorage } from '@/helpers'
import { createDocumentName } from '@/registry/create-document-name'

export async function loadDocument({
  namespace,
  slug,
  workspaceStore,
  registryDocuments,
  registryUrl,
  config,
  api,
  removable,
}: {
  namespace: string
  slug: string
  workspaceStore: WorkspaceStore
  registryDocuments: Ref<ApiMetadata[]>
  registryUrl: string
  config: Partial<ApiReferenceConfiguration>
  api: Api
  removable?: boolean
}) {
  const getDocumentResult = await api.getDocument({
    namespace,
    slug,
  })

  if (!getDocumentResult.success) {
    return
  }

  registryDocuments.value.push({ ...getDocumentResult.data, removable })

  const url = new URL(`/@${namespace}/apis/${slug}/latest`, registryUrl)

  const document: OpenAPIV3_1.Document = await bundle(url.toString(), {
    plugins: [fetchUrls()],
    treeShake: false,
  })

  const documentName = createDocumentName(namespace, slug)

  await workspaceStore.addDocument(
    {
      name: documentName,
      document,
    },
    config,
  )

  workspaceStore.update('x-scalar-active-document', documentName)

  restoreAuthSecretsFromStorage({ documentName, workspaceStore })

  return getDocumentResult.data
}
