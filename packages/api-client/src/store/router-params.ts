import type { Router } from 'vue-router'

import { PathId } from '@/routes'

type RouteParams = Record<PathId, string>

const routeParamKeys: PathId[] = [
  PathId.Collection,
  PathId.Environment,
  PathId.Request,
  PathId.Examples,
  PathId.Schema,
  PathId.Cookies,
  PathId.Servers,
  PathId.Workspace,
  PathId.Settings,
]

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
      routeParamKeys.forEach((key) => {
        const routeParam = currentRoute.params[key]
        if (typeof routeParam === 'string') {
          pathParams[key] = routeParam
        }
      })
    }

    return pathParams
  }
}
