/**
 * A query parameter an OpenAPI path key carries.
 *
 * Example: `beta=true` in the path key `/v1/messages?beta=true`.
 */
export type RequiredQueryParameter = {
  /** Name of the query parameter */
  name: string
  /** Value the request has to send for that parameter */
  value: string
}

/** An OpenAPI path key split into the parts Hono needs to route it */
type ParsedPathKey = {
  /** Hono route pattern, for example `/posts/:id` */
  route: string
  /** Query parameters that pick this path key over another one sharing its route */
  query: RequiredQueryParameter[]
}

/**
 * Split an OpenAPI path key into a Hono route and the query parameters it carries.
 *
 * Path keys are allowed to carry a query string (`/v1/messages?beta=true`), and generators use that
 * to describe two operations that share a path. Hono matches on the pathname alone — a `?` left in a
 * route reaches the router as a regular expression quantifier and makes it throw — so the query part
 * is handed back separately for the caller to match against the request.
 *
 * Example: `/v1/messages?beta=true` -> `{ route: '/v1/messages', query: [{ name: 'beta', value: 'true' }] }`
 */
export const parsePathKey = (path: string): ParsedPathKey => {
  const separatorIndex = path.indexOf('?')
  const pathname = separatorIndex === -1 ? path : path.slice(0, separatorIndex)
  const search = separatorIndex === -1 ? '' : path.slice(separatorIndex + 1)

  const query = Array.from(new URLSearchParams(search), ([name, value]) => ({ name, value }))
    // A request can never carry a parameter without a name, so such a pair would only ever make the
    // path key unreachable.
    .filter(({ name }) => name !== '')

  return { route: pathname.replace(/{/g, ':').replace(/}/g, ''), query }
}

/**
 * Convert an OpenAPI path key to a Hono route.
 *
 * Example: `/posts/{id}` -> `/posts/:id`
 */
export const honoRouteFromPath = (path: string): string => parsePathKey(path).route
