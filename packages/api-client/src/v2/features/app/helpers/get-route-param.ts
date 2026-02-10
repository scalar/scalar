import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import type { RouteLocationNormalizedGeneric } from 'vue-router'

import type { ScalarClientAppRouteParams } from '@/v2/features/app/helpers/routes'

/** Extracts a string parameter from the route */
export function getRouteParam(paramName: 'method', route: RouteLocationNormalizedGeneric | null): HttpMethod | undefined
export function getRouteParam(
  paramName: Exclude<ScalarClientAppRouteParams, 'method'>,
  route: RouteLocationNormalizedGeneric | null,
): string | undefined
export function getRouteParam(
  paramName: ScalarClientAppRouteParams,
  route: RouteLocationNormalizedGeneric | null,
): string | undefined {
  const param = route?.params[paramName]

  if (typeof param !== 'string') {
    return undefined
  }

  if (paramName === 'method') {
    return param && isHttpMethod(param) ? param : undefined
  }

  return decodeURIComponent(param)
}
