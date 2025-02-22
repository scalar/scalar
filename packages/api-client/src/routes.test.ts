import { describe, expect, it } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { routes } from './routes'

describe('Routes', () => {
  const mockRouteLocation = {
    params: {},
    matched: [],
    fullPath: '',
    query: {},
    hash: '',
    name: undefined,
    path: '',
    redirectedFrom: undefined,
    meta: {},
  }

  const router = createRouter({
    history: createWebHistory(),
    routes,
  })

  it('should contain the workspace route', () => {
    const workspaceRoute = router.getRoutes().find((route) => route.name === 'workspace')
    expect(workspaceRoute).toBeDefined()
    expect(workspaceRoute?.path).toBe('/workspace/:workspace')
  })

  it('should contain the default workspace redirect', () => {
    const workspaceDefaultRoute = router.getRoutes().find((route) => route.name === 'workspace.default')
    expect(workspaceDefaultRoute).toBeDefined()

    const redirectResult =
      typeof workspaceDefaultRoute?.redirect === 'function'
        ? workspaceDefaultRoute.redirect(mockRouteLocation)
        : workspaceDefaultRoute?.redirect

    expect(redirectResult).toEqual(
      expect.objectContaining({
        name: 'request.root',
        params: { workspace: 'default' },
      }),
    )
  })

  it('should contain the request route', () => {
    const requestRoute = router.getRoutes().find((route) => route.name === 'request')
    expect(requestRoute).toBeDefined()
    expect(requestRoute?.path).toBe('/workspace/:workspace/request/:request')
  })

  it('should contain the request root redirect', () => {
    const requestDefaultRoute = router.getRoutes().find((route) => route.name === 'request.root')
    expect(requestDefaultRoute).toBeDefined()

    const redirectResult =
      typeof requestDefaultRoute?.redirect === 'function'
        ? requestDefaultRoute.redirect(mockRouteLocation)
        : requestDefaultRoute?.redirect

    expect(redirectResult).toEqual(
      expect.objectContaining({
        name: 'request',
        params: { request: 'default' },
      }),
    )
  })

  it('should contain the environment route', () => {
    const environmentRoute = router.getRoutes().find((route) => route.name === 'environment')
    expect(environmentRoute).toBeDefined()
    expect(environmentRoute?.path).toBe('/workspace/:workspace/environment/:environment')
  })

  it('should contain the default environment redirect', () => {
    const environmentDefaultRoute = router.getRoutes().find((route) => route.name === 'environment.default')
    expect(environmentDefaultRoute).toBeDefined()

    const redirectResult =
      typeof environmentDefaultRoute?.redirect === 'function'
        ? environmentDefaultRoute.redirect(mockRouteLocation)
        : environmentDefaultRoute?.redirect

    expect(redirectResult).toEqual(
      expect.objectContaining({
        name: 'environment',
        params: { environment: 'default' },
      }),
    )
  })

  it('should contain the cookies route', () => {
    const cookiesRoute = router.getRoutes().find((route) => route.name === 'cookies')
    expect(cookiesRoute).toBeDefined()
    expect(cookiesRoute?.path).toBe('/workspace/:workspace/cookies/:cookies')
  })

  it('should contain the default cookies redirect', () => {
    const cookiesDefaultRoute = router.getRoutes().find((route) => route.name === 'cookies.default')
    expect(cookiesDefaultRoute).toBeDefined()

    const redirectResult =
      typeof cookiesDefaultRoute?.redirect === 'function'
        ? cookiesDefaultRoute.redirect(mockRouteLocation)
        : cookiesDefaultRoute?.redirect

    expect(redirectResult).toEqual(
      expect.objectContaining({
        name: 'cookies',
        params: { cookies: 'default' },
      }),
    )
  })

  it('should contain the default servers redirect', () => {
    const serversDefaultRoute = router.getRoutes().find((route) => route.name === 'servers.default')
    expect(serversDefaultRoute).toBeDefined()

    const redirectResult =
      typeof serversDefaultRoute?.redirect === 'function'
        ? serversDefaultRoute.redirect(mockRouteLocation)
        : serversDefaultRoute?.redirect

    expect(redirectResult).toEqual(
      expect.objectContaining({
        name: 'servers',
        params: { collection: 'default', servers: 'default' },
      }),
    )
  })

  it('should contain the settings route', () => {
    const settingsRoute = router.getRoutes().find((route) => route.name === 'settings')
    expect(settingsRoute).toBeDefined()
    expect(settingsRoute?.path).toBe('/workspace/:workspace/settings/:settings')
  })

  it('should contain the default settings redirect', () => {
    const settingsDefaultRoute = router.getRoutes().find((route) => route.name === 'settings.default')
    expect(settingsDefaultRoute).toBeDefined()

    const redirectResult =
      typeof settingsDefaultRoute?.redirect === 'function'
        ? settingsDefaultRoute.redirect(mockRouteLocation)
        : settingsDefaultRoute?.redirect

    expect(redirectResult).toEqual(
      expect.objectContaining({
        name: 'settings',
        params: { settings: 'general' },
      }),
    )
  })
})
