import { PATH_KEY_TEMPLATE, splitPathKey } from '@/utils/split-path-key'

/**
 * How specific one path segment is, lower being more specific:
 *
 * - `0` — literal text only (`messages`, `users:batchGet`), which matches one value
 * - `1` — a template mixed with literal text (`{jobId}:cancel`), which matches a subset of values
 * - `2` — nothing but templates (`{id}`, `{a}{b}`), which matches any value
 */
type SegmentSpecificity = 0 | 1 | 2

/**
 * Rank one segment of a path key.
 *
 * A segment that mixes a template with literal text ranks between the two, because the router
 * enforces its literal text (see `honoRouteFromPath`).
 */
const segmentSpecificity = (segment: string): SegmentSpecificity => {
  const literalText = segment.replace(PATH_KEY_TEMPLATE, '')

  if (literalText === segment) {
    return 0
  }

  return literalText === '' ? 2 : 1
}

/**
 * Describe how specific a path key is, one rank per `/`-separated segment of its path portion.
 *
 * The query string of the key is ignored: it does not take part in routing, and variants of one path
 * are ordered among themselves by how many query parameters they pin.
 */
export const getPathSpecificity = (pathKey: string): readonly SegmentSpecificity[] => {
  const { path: pathname } = splitPathKey(pathKey)

  return pathname.split('/').map((segment) => segmentSpecificity(segment))
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
