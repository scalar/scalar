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

/** Whether the template at `index` of a split segment directly follows another template. */
const isMergedTemplate = (parts: string[], index: number): boolean => index > 1 && parts[index - 1] === ''

/**
 * Build a regular expression that matches a path segment verbatim.
 *
 * Literal text is escaped and a template matches anything but a slash. Every template except the
 * last one also stops at the first place the literal behind it appears after a nonempty prefix, so
 * its match has exactly one possible end: an OpenAPI document is untrusted input, and a
 * segment made of several plain `[^/]+` groups backtracks exponentially on a crafted request, which
 * would block the event loop of the whole server. Stopping at the whole literal rather than at its
 * first character keeps `{id}-v{version}` matching an id with a dash in it. The last template stays
 * greedy, so the common `{name}:cancel` shape still accepts a value that contains the delimiter.
 *
 * With `capture`, every template that can be told apart from its neighbours becomes a capturing
 * group, in the order `parametersFromSegment` reads them back.
 */
const patternFromSegment = (segment: string, capture = false): string => {
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

    // A separator can also start a value, such as the minus sign in `/range/-1-5`. Consume one
    // character before looking for the separator so the parameter stays nonempty without branching.
    const group = index === lastTemplate ? '[^/]+' : `[^/](?:(?!${escapeRegExpLiteral(followingLiteral)})[^/])*`

    pattern += capture && !isMergedTemplate(parts, index) ? `(${group})` : group
  }

  return pattern
}

/**
 * Whether a segment mixes a template with literal text, as in `{id}.json` or `v{version}`.
 *
 * Hono reads `:id.json` as one parameter named `id.json` that matches any value, and `v:version` as
 * the literal text `v:version`. So such a segment has to be a pattern for its literal text to be
 * enforced, and its parameters are bound back by name from the matched value (see `pathParameters`).
 */
const hasEmbeddedTemplate = (segment: string): boolean =>
  segment.replace(PATH_KEY_TEMPLATE, '') !== '' && segment.replace(PATH_KEY_TEMPLATE, '') !== segment

/** Decode a path parameter value the way Hono does, keeping it verbatim when it is malformed. */
const decodeParameterValue = (value: string): string => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Read the path parameters of one segment out of the request segment it matched.
 *
 * The request segment is matched with the same pattern the route was registered with, before it is
 * decoded, so every parameter gets the part of the segment the router assigned to it — an encoded
 * delimiter such as `%2C` in `{a},{b}` stays inside its value. Each part is decoded afterwards.
 * Templates with nothing between them cannot be told apart and stay unbound.
 */
export const parametersFromSegment = (segment: string, requestSegment: string): Record<string, string> => {
  const parts = segment.split(PATH_KEY_TEMPLATE)
  const names = parts.filter(
    (_, index): boolean =>
      index % 2 === 1 && (parts[index + 1] !== '' || index === parts.length - 2) && !isMergedTemplate(parts, index),
  )
  const match = new RegExp(`^${patternFromSegment(segment, true)}$`).exec(requestSegment)

  if (!match) {
    return {}
  }

  return Object.fromEntries(
    names.flatMap((name, index): Array<readonly [string, string]> => {
      const parameterValue = match[index + 1]

      return parameterValue === undefined ? [] : [[name, decodeParameterValue(parameterValue)] as const]
    }),
  )
}

/**
 * Convert an OpenAPI path key into the segments of a Hono route, one entry per `/`-separated segment
 * of the path portion of the key.
 *
 * The segments are returned on their own, rather than as a route string, because an escaped segment
 * carries a regular expression with a `/` in it (`[^/]+`), so the joined route cannot be split back
 * into segments. Everything else about the conversion is described on `honoRouteFromPath`.
 */
export const honoRouteSegmentsFromPath = (path: string): string[] => {
  const { path: pathname } = splitPathKey(path)

  const route: string[] = []

  let literalIndex = 0
  let previousIsPattern: boolean = false

  // A synthesized name must not be one the document declares, or Hono binds both to one value.
  const declaredNames = new Set([...pathname.matchAll(new RegExp(PATH_KEY_TEMPLATE))].map(([, name]) => name))
  const nextSyntheticName = (): string => {
    while (declaredNames.has(`${LITERAL_PARAMETER_PREFIX}${literalIndex}`)) {
      literalIndex++
    }

    return `${LITERAL_PARAMETER_PREFIX}${literalIndex++}`
  }

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
      hasEmbeddedTemplate(segment) ||
      (previousIsPattern && plainSegment !== '' && !plainSegment.startsWith(':'))

    if (needsPattern) {
      route.push(`:${nextSyntheticName()}{${patternFromSegment(segment)}}`)
    } else {
      route.push(plainSegment)
    }

    previousIsPattern = needsPattern
  }

  return route
}

/**
 * Convert an OpenAPI path key into a Hono route.
 *
 * Example: `/posts/{id}` → `/posts/:id`
 *
 * A segment whose literal text would be read as routing syntax, or that mixes a template with
 * literal text (`{id}.json`, `v{version}`), is registered as a single parameter with an explicit
 * pattern instead, because Hono allows only one parameter per segment and that is the only way to
 * make it match such a segment verbatim. Hono then binds the whole segment to the synthesized
 * parameter, so `pathParameters` splits it back into the parameters the path key declares.
 *
 * A query string in the key (`/v1/messages?beta=true`) is dropped here — it is matched against the
 * incoming request separately, see `splitPathKey`.
 */
export const honoRouteFromPath = (path: string): string => honoRouteSegmentsFromPath(path).join('/')
