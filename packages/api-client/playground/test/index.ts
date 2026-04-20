import { createWorkspaceStore } from '@scalar/workspace-store/client'
import {
  buildRequest,
  getEnvironmentVariables,
  getRequestExampleContext,
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

const { request: requestBuilder } = requestFactory({
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

const { requestPayload, isUsingProxy } = buildRequest(requestBuilder, {
  envVariables: getEnvironmentVariables(context.data.environment.environment),
})

void sendRequest({
  requestPayload,
  isUsingProxy,
})
