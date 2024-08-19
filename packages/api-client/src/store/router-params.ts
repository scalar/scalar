import { PathId } from '@/router'
import type { Router } from 'vue-router'

export type RouterPathParams = Record<PathId, string>

/** Getter function for router parameters */
export function getRouterParams(router: Router) {
  return () => {
    const pathParams = {
      [PathId.Collection]: 'default',
      [PathId.Environment]: 'default',
      [PathId.Request]: 'default',
      [PathId.Examples]: 'default',
      [PathId.Schema]: 'default',
      [PathId.Cookies]: 'default',
      [PathId.Servers]: 'default',
      [PathId.Workspace]: 'default',
    }

    const currentRoute = router.currentRoute.value

    if (currentRoute) {
      Object.values(PathId).forEach((k) => {
        if (currentRoute.params[k]) {
          pathParams[k] = currentRoute.params[k] as string
        }
      })
    }

    return pathParams
  }
}
