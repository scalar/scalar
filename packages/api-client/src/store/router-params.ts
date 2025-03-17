import { PathId } from '@/router'
import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Collection, Request, RequestExample, Server } from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import type { Router } from 'vue-router'

/** Getter function for router parameters */
export function getRouterParams(router?: Router) {
  return () => {
    const pathParams = {
      [PathId.Collection]: 'default' as Collection['uid'],
      [PathId.Environment]: 'default' as Environment['uid'],
      [PathId.Request]: 'default' as Request['uid'],
      [PathId.Examples]: 'default' as RequestExample['uid'],
      [PathId.Schema]: 'default' as string,
      [PathId.Cookies]: 'default' as Cookie['uid'],
      [PathId.Servers]: 'default' as Server['uid'],
      [PathId.Workspace]: 'default' as Workspace['uid'],
      [PathId.Settings]: 'default' as string,
    } as const

    const currentRoute = router?.currentRoute.value

    if (currentRoute) {
      ;(Object.keys(pathParams) as (keyof typeof pathParams)[]).forEach((k) => {
        if (currentRoute.params[k]) {
          // @ts-expect-error this gives us good types without redoing PathId :)
          pathParams[k] = currentRoute.params[k]
        }
      })
    }

    return pathParams
  }
}
