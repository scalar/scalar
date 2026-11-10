import type { Context } from 'hono'

import {
  LITERAL_PARAMETER_PREFIX,
  honoRouteSegmentsFromPath,
  parametersFromSegment,
} from '@/utils/hono-route-from-path'
import { getMockedOperation } from '@/utils/mocked-operation'
import { splitPathKey } from '@/utils/split-path-key'

/** Matches the parameters `honoRouteFromPath` synthesizes, which always carry an explicit pattern. */
const synthesizedParameter = new RegExp(`:(${LITERAL_PARAMETER_PREFIX}\\d+)\\{`, 'g')

/** Matches a route segment that is a synthesized parameter. */
const synthesizedSegment = new RegExp(`^:(${LITERAL_PARAMETER_PREFIX}\\d+)\\{`)

/**
 * Read the path parameters of a request, without the ones synthesized for routing.
 *
 * A path segment Hono cannot match as written is registered as a parameter with a generated name
 * (see `honoRouteFromPath`). That name is an implementation detail, so it has no business showing up
 * in an `x-handler` context or among the variables a mocked response body is generated from.
 *
 * The names are read back off the matched route rather than recognized by their prefix, so a
 * document that happens to declare a parameter of the same name keeps it. The value of a synthesized
 * parameter is split into the parameters its segment declares, as in `{id}.json` or `{from}-{to}`,
 * which needs the OpenAPI path key the request matched.
 */
export const pathParameters = (context: Context): Record<string, string> => {
  const synthesized = new Set([...context.req.routePath.matchAll(synthesizedParameter)].map(([, name]) => name))
  const values = context.req.param()
  const declared = Object.fromEntries(Object.entries(values).filter(([name]) => !synthesized.has(name)))
  const pathKey = getMockedOperation(context)?.path

  if (pathKey === undefined) {
    return declared
  }

  // The path key lines up with the end of the request path, which carries any base path in front.
  const segments = splitPathKey(pathKey).path.split('/')
  const requestSegments = context.req.path.split('/').slice(-segments.length)
  const embedded = honoRouteSegmentsFromPath(pathKey).flatMap((route, index): Record<string, string>[] => {
    const requestSegment = requestSegments[index]

    return synthesizedSegment.test(route) && requestSegment !== undefined
      ? [parametersFromSegment(segments[index] ?? '', requestSegment)]
      : []
  })

  return Object.assign({}, ...embedded, declared)
}
