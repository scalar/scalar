import { LITERAL_PARAMETER_PREFIX, honoRouteSegmentsFromPath } from '@/utils/hono-route-from-path'
import { PATH_KEY_TEMPLATE, splitPathKey } from '@/utils/split-path-key'

/**
 * How specific one path segment is, lower being more specific:
 *
 * - `0` — literal text only (`messages`, `users:batchGet`), which matches one value
 * - `1` — a template mixed with literal text (`{jobId}:cancel`), which matches a subset of values
 * - `2` — nothing but templates (`{id}`, `{a}{b}`), which matches any value
 */
type SegmentSpecificity = 0 | 1 | 2

/** Matches a segment the route compiler turned into a parameter with an explicit pattern. */
const PATTERN_SEGMENT = new RegExp(`^:${LITERAL_PARAMETER_PREFIX}\\d+\\{`)

/**
 * Rank one segment of a path key, given the Hono route segment it compiles to.
 *
 * A segment that mixes a template with literal text ranks between the two, as long as the router
 * actually enforces that literal text. Not every mixed segment compiles that way: `{name}.json`
 * becomes the whole-segment parameter `:name.json`, which Hono matches against any value. Such a
 * segment ranks like a bare template, because ranking it higher would let it answer requests meant
 * for a plain `{id}` sibling that the document may well have declared first.
 */
const segmentSpecificity = (segment: string, routeSegment: string): SegmentSpecificity => {
  const literalText = segment.replace(PATH_KEY_TEMPLATE, '')

  if (literalText === segment) {
    return 0
  }

  if (literalText === '') {
    return 2
  }

  const matchesAnyValue = routeSegment.startsWith(':') && !PATTERN_SEGMENT.test(routeSegment)

  return matchesAnyValue ? 2 : 1
}

/**
 * Describe how specific a path key is, one rank per `/`-separated segment of its path portion.
 *
 * The query string of the key is ignored: it does not take part in routing, and variants of one path
 * are ordered among themselves by how many query parameters they pin.
 */
export const getPathSpecificity = (pathKey: string): readonly SegmentSpecificity[] => {
  const { path: pathname } = splitPathKey(pathKey)
  const routeSegments = honoRouteSegmentsFromPath(pathname)

  return pathname.split('/').map((segment, index) => segmentSpecificity(segment, routeSegments[index] ?? ''))
}

/**
 * Order two paths so the more concrete one is matched first, as the OpenAPI Paths Object asks:
 * "When matching URLs, concrete (non-templated) paths would be matched before their templated
 * counterparts."
 *
 * Segments are compared position by position and the first one that differs decides, so
 * `/pets/mine` comes before `/pets/{petId}`, and `/a/literal/{y}` before `/a/{x}/b`. The specification
 * leaves pairs like `/{entity}/me` and `/books/{id}` ambiguous and up to the tooling; reading from
 * the left, the way a path is resolved one segment at a time, settles them toward `/books/{id}`.
 *
 * Paths with a different number of segments can never match the same request, because a path
 * parameter never matches a `/`, so the shorter one simply goes first to keep the order total. Paths
 * that rank the same return `0` and keep their relative order in a stable sort.
 */
export const comparePathSpecificity = (
  left: readonly SegmentSpecificity[],
  right: readonly SegmentSpecificity[],
): number => {
  for (let index = 0; index < Math.min(left.length, right.length); index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0)

    if (difference !== 0) {
      return difference
    }
  }

  return left.length - right.length
}
