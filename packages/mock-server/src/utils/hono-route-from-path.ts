import { PATH_KEY_TEMPLATE, splitPathKey } from '@/utils/split-path-key'

/**
 * Characters Hono reads as routing syntax instead of as literal path text.
 *
 * `:` starts a path parameter and `*` is a wildcard. The remaining ones end up verbatim in the
 * regular expression that Hono's `RegExpRouter` compiles, where they act as quantifier (`?`),
 * alternation (`|`) and pattern delimiters (`{`, `}`) — a path key containing them either routes
 * the wrong requests or makes the router throw. Hono escapes the other regular expression
 * metacharacters (`.`, `+`, `(`, `[`, …) itself.
 */
const HONO_ROUTING_CHARACTERS = /[:*?|{}]/

/** Prefix for the parameters we synthesize to match a literal path segment verbatim. */
export const LITERAL_PARAMETER_PREFIX = '__scalar_literal_'

/**
 * Escape a literal for use inside the regular expression of a Hono `:name{pattern}` parameter.
 *
 * Every non-alphanumeric ASCII character becomes a `\xHH` escape. That keeps regular expression
 * metacharacters inert and — just as importantly — keeps `{` and `}` out of the pattern, which Hono
 * uses to delimit it. Non-ASCII characters carry no regular expression meaning and are left alone,
 * because `\xHH` cannot express them.
 */
const escapeRegExpLiteral = (value: string): string =>
  value.replace(/[^A-Za-z0-9]/g, (character) => {
    const code = character.charCodeAt(0)

    return code < 128 ? `\\x${code.toString(16).padStart(2, '0')}` : character
  })

/**
 * Build a regular expression that matches a path segment verbatim.
 *
 * Literal text is escaped and a template matches anything but a slash. Every template except the
 * last one also excludes the character the literal behind it starts with, so its match has exactly
 * one possible end and the engine never has to search: an OpenAPI document is untrusted input, and a
 * segment made of several plain `[^/]+` groups backtracks exponentially on a crafted request, which
 * would block the event loop of the whole server. The last template stays greedy, so the common
 * `{name}:cancel` shape still accepts a value that contains the delimiter.
 */
const patternFromSegment = (segment: string): string => {
  // Splitting on a regular expression with a capturing group interleaves literals and parameter
  // names, so every odd entry is a template and the list always begins and ends with a literal.
  const parts = segment.split(PATH_KEY_TEMPLATE)

  // The split always yields `2n + 1` entries for `n` templates, so the last template sits two
  // entries from the end — and at `-1` when the segment carries no template at all.
  const lastTemplate = parts.length - 2

  let pattern = ''

  for (let index = 0; index < parts.length; index++) {
    if (index % 2 === 0) {
      pattern += escapeRegExpLiteral(parts[index] ?? '')
      continue
    }

    const followingLiteral = parts[index + 1] ?? ''

    // Templates with nothing between them cannot be told apart, so they match as a single group.
    if (followingLiteral === '' && index !== lastTemplate) {
      continue
    }

    const delimiter = index === lastTemplate ? '' : escapeRegExpLiteral(followingLiteral.slice(0, 1))

    pattern += `[^/${delimiter}]+`
  }

  return pattern
}

/**
 * Convert an OpenAPI path key into a Hono route.
 *
 * Example: `/posts/{id}` → `/posts/:id`
 *
 * A segment whose literal text would be read as routing syntax is registered as a single parameter
 * with an explicit pattern instead, because Hono allows only one parameter per segment and that is
 * the only way to make it match such a segment verbatim. The request then routes to the right
 * operation, but the path parameters of that one segment are no longer bound by name: they surface
 * as the synthesized parameter, and a required path parameter in it reads as missing to request
 * validation. Hono cannot express both at once, and matching the wrong operation is worse.
 *
 * A query string in the key (`/v1/messages?beta=true`) is dropped here — it is matched against the
 * incoming request separately, see `splitPathKey`.
 */
export function honoRouteFromPath(path: string): string {
  const { path: pathname } = splitPathKey(path)

  const route: string[] = []

  let literalIndex = 0
  let previousIsPattern: boolean = false

  for (const segment of pathname.split('/')) {
    // Check the literal text and the parameter names, but not the braces around them — the `:` we
    // generate for a template is meant to be routing syntax, a `?` in a parameter name is not.
    const routeText = segment.replace(PATH_KEY_TEMPLATE, '$1')
    const plainSegment = segment.replace(PATH_KEY_TEMPLATE, ':$1')

    // Hono splices the segment that follows a pattern into a lookahead without escaping it, unless
    // that segment is a parameter itself. So once one segment is a pattern, every segment behind it
    // has to be one too — otherwise a regular expression metacharacter further down the path makes
    // the router throw on every request. An empty segment (a trailing slash, or `//`) is exempt:
    // Hono skips the lookahead for it, and it has no literal text to turn into a pattern.
    const needsPattern: boolean =
      HONO_ROUTING_CHARACTERS.test(routeText) ||
      (previousIsPattern && plainSegment !== '' && !plainSegment.startsWith(':'))

    if (needsPattern) {
      route.push(`:${LITERAL_PARAMETER_PREFIX}${literalIndex++}{${patternFromSegment(segment)}}`)
    } else {
      route.push(plainSegment)
    }

    previousIsPattern = needsPattern
  }

  return route.join('/')
}
