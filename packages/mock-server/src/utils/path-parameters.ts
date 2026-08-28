import type { Context } from 'hono'

import { LITERAL_PARAMETER_PREFIX } from '@/utils/hono-route-from-path'

/** Matches the parameters `honoRouteFromPath` synthesizes, which always carry an explicit pattern. */
const synthesizedParameter = new RegExp(`:(${LITERAL_PARAMETER_PREFIX}\\d+)\\{`, 'g')

/**
 * Read the path parameters of a request, without the ones synthesized for routing.
 *
 * A path segment Hono cannot match as written is registered as a parameter with a generated name
 * (see `honoRouteFromPath`). That name is an implementation detail, so it has no business showing up
 * in an `x-handler` context or among the variables a mocked response body is generated from.
 *
 * The names are read back off the matched route rather than recognized by their prefix, so a
 * document that happens to declare a parameter of the same name keeps it.
 */
export const pathParameters = (context: Context): Record<string, string> => {
  const synthesized = new Set([...context.req.routePath.matchAll(synthesizedParameter)].map(([, name]) => name))

  return Object.fromEntries(Object.entries(context.req.param()).filter(([name]) => !synthesized.has(name)))
}
