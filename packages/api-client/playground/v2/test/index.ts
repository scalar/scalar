import { createWorkspaceStore } from '@scalar/workspace-store/client'
import {
  buildRequest,
  getEnvironmentVariables,
  getRequestExampleContext,
  getServerVariables,
  requestFactory,
} from '@scalar/workspace-store/request-example'

import { sendRequest } from '@/v2/blocks/operation-block/helpers/send-request'

const workspaceStore = createWorkspaceStore({
  plugins: [],
})

void workspaceStore.addDocument({
  name: 'galaxy',
  url: 'https://galaxy.scalar.com/openapi.json',
})

const context = getRequestExampleContext(workspaceStore, 'galaxy', {
  path: '/planets',
  method: 'get',
  exampleName: 'example',
})

if (context.ok === false) {
  throw new Error(context.error)
}

const requestBuilder = requestFactory({
  isElectron: false,
  defaultHeaders: context.data.headers.default,
  environment: context.data.environment.environment,
  exampleName: 'example',
  globalCookies: [],
  method: 'get',
  operation: context.data.operation,
  path: '/planets',
  proxyUrl: 'https://proxy.scalar.com',
  server: null,
  selectedSecuritySchemes: [],
})

if (requestBuilder.ok === false) {
  throw new Error(requestBuilder.error)
}

const { request } = buildRequest(requestBuilder.data.request, {
  envVariables: getEnvironmentVariables(context.data.environment.environment),
  serverVariables: getServerVariables(context.data.servers.selected),
})

void sendRequest({
  request,
  operation: context.data.operation,
  isUsingProxy: requestBuilder.data.request.proxy.isUsingProxy,
  plugins: [],
})
