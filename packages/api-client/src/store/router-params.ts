import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Collection, Request, RequestExample, Server } from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import type { Router } from 'vue-router'

import { PathId } from '@/routes'

type RouteParams = {
  [PathId.Collection]: Collection['uid'] | 'default'
  [PathId.Environment]: Environment['uid'] | 'default'
  [PathId.Request]: Request['uid'] | 'default'
  [PathId.Examples]: RequestExample['uid'] | 'default'
  [PathId.Schema]: string
  [PathId.Cookies]: Cookie['uid'] | 'default'
  [PathId.Servers]: Server['uid'] | 'default'
  [PathId.Workspace]: Workspace['uid'] | 'default'
  [PathId.Settings]: string
}

const isRouteParamString = (value: unknown): value is string => typeof value === 'string'
const isEntityUid = <T extends string>(value: unknown): value is T => isRouteParamString(value)

/** Getter function for router parameters */
export function getRouterParams(router?: Router) {
  return () => {
    const pathParams: RouteParams = {
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

    const currentRoute = router?.currentRoute.value

    if (currentRoute) {
      const collection = currentRoute.params[PathId.Collection]
      if (isEntityUid<Collection['uid']>(collection)) {
        pathParams[PathId.Collection] = collection
      }

      const environment = currentRoute.params[PathId.Environment]
      if (isEntityUid<Environment['uid']>(environment)) {
        pathParams[PathId.Environment] = environment
      }

      const request = currentRoute.params[PathId.Request]
      if (isEntityUid<Request['uid']>(request)) {
        pathParams[PathId.Request] = request
      }

      const example = currentRoute.params[PathId.Examples]
      if (isEntityUid<RequestExample['uid']>(example)) {
        pathParams[PathId.Examples] = example
      }

      const schema = currentRoute.params[PathId.Schema]
      if (isRouteParamString(schema)) {
        pathParams[PathId.Schema] = schema
      }

      const cookie = currentRoute.params[PathId.Cookies]
      if (isEntityUid<Cookie['uid']>(cookie)) {
        pathParams[PathId.Cookies] = cookie
      }

      const server = currentRoute.params[PathId.Servers]
      if (isEntityUid<Server['uid']>(server)) {
        pathParams[PathId.Servers] = server
      }

      const workspace = currentRoute.params[PathId.Workspace]
      if (isEntityUid<Workspace['uid']>(workspace)) {
        pathParams[PathId.Workspace] = workspace
      }

      const settings = currentRoute.params[PathId.Settings]
      if (isRouteParamString(settings)) {
        pathParams[PathId.Settings] = settings
      }
    }

    return pathParams
  }
}
