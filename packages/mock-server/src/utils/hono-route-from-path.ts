import { splitPathKey } from '@/utils/split-path-key'

/** Matches a `{parameterName}` template inside a path key. */
const TEMPLATE_PARAMETER = /\{([^{}]+)\}/g

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
const LITERAL_PARAMETER_PREFIX = '__scalar_literal_'

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
 * Templates match anything but a slash, everything else is escaped. Splitting on a regular
 * expression with a capturing group interleaves literals and parameter names, so every odd entry is
 * a template.
 */
const patternFromSegment = (segment: string): string =>
  segment
    .split(TEMPLATE_PARAMETER)
    .map((part, index) => (index % 2 === 1 ? '[^/]+' : escapeRegExpLiteral(part)))
    .join('')

/**
 * Convert an OpenAPI path key into a Hono route.
 *
 * Example: `/posts/{id}` → `/posts/:id`
 *
 * A segment whose literal text would be read as routing syntax is registered as a parameter with an
 * explicit pattern instead, because that is the only way to make Hono match it verbatim. Such a
 * segment gives up its parameter names, which is a fair trade for routing the request at all.
 *
 * A query string in the key (`/v1/messages?beta=true`) is dropped here — it is matched against the
 * incoming request separately, see `splitPathKey`.
 */
export function honoRouteFromPath(path: string): string {
  const { path: pathname } = splitPathKey(path)

  let literalIndex = 0

  return pathname
    .split('/')
    .map((segment) => {
      // Check the literal text and the parameter names, but not the braces around them — the `:` we
      // generate for a template is meant to be routing syntax, a `?` in a parameter name is not.
      const routeText = segment.replace(TEMPLATE_PARAMETER, '$1')

      if (!HONO_ROUTING_CHARACTERS.test(routeText)) {
        return segment.replace(TEMPLATE_PARAMETER, ':$1')
      }

      return `:${LITERAL_PARAMETER_PREFIX}${literalIndex++}{${patternFromSegment(segment)}}`
    })
    .join('/')
}
