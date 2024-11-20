import { PathId } from '@/router'
import type { Router } from 'vue-router'

export type RouterPathParams = Record<PathId, string>
export const defaultRouterParamsFactory = () => ({
  [PathId.Collection]: 'default',
  [PathId.Environment]: 'default',
  [PathId.Request]: 'default',
  [PathId.Examples]: 'default',
  [PathId.Schema]: 'default',
  [PathId.Cookies]: 'default',
  [PathId.Servers]: 'default',
  [PathId.Workspace]: 'default',
  [PathId.Settings]: 'default',
})

/** Getter function for router parameters */
export function getRouterParams(router: Router) {
  return () => {
    const pathParams = defaultRouterParamsFactory()
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
