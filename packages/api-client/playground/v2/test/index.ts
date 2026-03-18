import { createWorkspaceStore } from '@scalar/workspace-store/client'

import { buildRequest } from '@/v2/blocks/operation-block/helpers/build-request'
import { sendRequest } from '@/v2/blocks/operation-block/helpers/send-request'

const workspaceStore = createWorkspaceStore({
  plugins: [],
})

workspaceStore.addDocument({
  name: 'galaxy',
  url: 'https://galaxy.scalar.com/openapi.json',
})

const operation = workspaceStore?.workspace?.documents?.['galaxy']?.paths?.['/planets']?.['get']

if (!operation) throw new Error('Operation not found')

const [error, built] = buildRequest({
  'environment': {
    color: 'red',
    description: '',
    'variables': [] as any,
  },
  'method': 'get',
  'path': '/planets',
  'operation': operation,
  'globalCookies': [],
  /** The proxy URL for cookie domain determination */
  proxyUrl: 'https://proxy.scalar.com',
  /** The server object */
  server: null,
  exampleKey: 'example',
  /** The selected security schemes for the current operation */
  selectedSecuritySchemes: [],
})

if (error) throw error

void sendRequest({ request: built.request, operation, isUsingProxy: built.isUsingProxy, plugins: [] })
