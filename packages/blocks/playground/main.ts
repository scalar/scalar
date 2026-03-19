import { createWorkspaceStore } from '@scalar/workspace-store/client'

import { mountOperationCodeSample } from '../src/operation-code-sample/mount'
import EXAMPLE_DOCUMENT from './openapi.json?raw'

const store = createWorkspaceStore()
await store.addDocument(JSON.parse(EXAMPLE_DOCUMENT))

mountOperationCodeSample('#operation-code-sample', {
  store,
  path: '/hello',
  method: 'post',
})
