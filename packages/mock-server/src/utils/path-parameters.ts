import type { Context } from 'hono'

import { LITERAL_PARAMETER_PREFIX } from '@/utils/hono-route-from-path'

/**
 * Read the path parameters of a request, without the ones synthesized for routing.
 *
 * A path segment Hono cannot match as written is registered as a parameter with a generated name
 * (see `honoRouteFromPath`). That name is an implementation detail, so it has no business showing up
 * in an `x-handler` context or among the variables a mocked response body is generated from.
 */
export function pathParameters(context: Context): Record<string, string> {
  return Object.fromEntries(
    Object.entries(context.req.param()).filter(([name]) => !name.startsWith(LITERAL_PARAMETER_PREFIX)),
  )
}
