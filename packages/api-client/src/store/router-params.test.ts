import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { PathId } from '@/routes'

import { getRouterParams } from './router-params'

const defaultRouteParams = {
  [PathId.Collection]: 'default',
  [PathId.Environment]: 'default',
  [PathId.Request]: 'default',
  [PathId.Examples]: 'default',
  [PathId.Schema]: 'default',
  [PathId.Cookies]: 'default',
  [PathId.Servers]: 'default',
  [PathId.Workspace]: 'default',
  [PathId.Settings]: 'default',
}

const createTestRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: `/workspace/:${PathId.Workspace}/collection/:${PathId.Collection}/request/:${PathId.Request}/examples/:${PathId.Examples}/schema/:${PathId.Schema}/cookies/:${PathId.Cookies}/servers/:${PathId.Servers}/settings/:${PathId.Settings}`,
        name: 'test',
        component: { template: '<div />' },
      },
    ],
  })

describe('router-params', () => {
  it('returns defaults when no router is provided', () => {
    const params = getRouterParams()()

    expect(params).toStrictEqual(defaultRouteParams)
  })

  it('reads string params from the current route', async () => {
    const router = createTestRouter()

    await router.push(
      '/workspace/workspace-uid/collection/collection-uid/request/request-uid/examples/example-uid/schema/schema-id/cookies/cookie-uid/servers/server-uid/settings/request',
    )
    await router.isReady()

    const params = getRouterParams(router)()

    expect(params).toStrictEqual({
      [PathId.Collection]: 'collection-uid',
      [PathId.Environment]: 'default',
      [PathId.Request]: 'request-uid',
      [PathId.Examples]: 'example-uid',
      [PathId.Schema]: 'schema-id',
      [PathId.Cookies]: 'cookie-uid',
      [PathId.Servers]: 'server-uid',
      [PathId.Workspace]: 'workspace-uid',
      [PathId.Settings]: 'request',
    })
  })
})
