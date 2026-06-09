import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'

/** Realm advertised in `WWW-Authenticate` challenges. */
const REALM = 'Scalar Mock Server'

/**
 * Validate the shape of a `Basic` credential.
 *
 * Like Prism, we do not verify the credential against a user store (a mock server
 * has no way to know valid credentials), but we do check that the header is a
 * well-formed `Basic <base64(user:password)>` value.
 */
function isValidBasicAuth(authHeader?: string): boolean {
  if (!authHeader?.startsWith('Basic ')) {
    return false
  }

  const encoded = authHeader.slice('Basic '.length).trim()

  if (!encoded) {
    return false
  }

  try {
    // A valid Basic credential decodes to `user:password`, so it must contain a colon.
    return atob(encoded).includes(':')
  } catch {
    // `atob` throws on invalid base64.
    return false
  }
}

/**
 * Validate the shape of a `Bearer` credential.
 *
 * We only check that a non-empty token is present after the scheme. Verifying the
 * token itself (signature, expiry, scopes) is out of scope for a mock server.
 */
function isValidBearerAuth(authHeader?: string): boolean {
  if (!authHeader?.startsWith('Bearer ')) {
    return false
  }

  return authHeader.slice('Bearer '.length).trim().length > 0
}

/** Check whether a single security scheme is satisfied by the request. */
function isSchemeSatisfied(scheme: OpenAPIV3_1.SecuritySchemeObject, c: Context): boolean {
  switch (scheme.type) {
    case 'http': {
      const authHeader = c.req.header('Authorization')

      if ('scheme' in scheme && scheme.scheme?.toLowerCase() === 'basic') {
        return isValidBasicAuth(authHeader)
      }

      if ('scheme' in scheme && scheme.scheme?.toLowerCase() === 'bearer') {
        return isValidBearerAuth(authHeader)
      }

      return false
    }
    case 'apiKey': {
      if (!('name' in scheme) || !scheme.name || !('in' in scheme)) {
        return false
      }

      const value =
        scheme.in === 'header'
          ? c.req.header(scheme.name)
          : scheme.in === 'query'
            ? c.req.query(scheme.name)
            : scheme.in === 'cookie'
              ? getCookie(c, scheme.name)
              : undefined

      return Boolean(value)
    }
    // OAuth 2.0 and OpenID Connect both carry a bearer token in the `Authorization` header.
    case 'oauth2':
    case 'openIdConnect':
      return isValidBearerAuth(c.req.header('Authorization'))
    default:
      return false
  }
}

/**
 * Build the `WWW-Authenticate` challenge for a single security scheme.
 *
 * Returns `null` for schemes that do not map to an HTTP authentication challenge.
 */
function getChallenge(scheme: OpenAPIV3_1.SecuritySchemeObject): string | null {
  switch (scheme.type) {
    case 'http':
      if ('scheme' in scheme && scheme.scheme?.toLowerCase() === 'basic') {
        return `Basic realm="${REALM}", charset="UTF-8"`
      }

      if ('scheme' in scheme && scheme.scheme?.toLowerCase() === 'bearer') {
        return `Bearer realm="${REALM}", error="invalid_token", error_description="The access token is invalid or has expired"`
      }

      return null
    case 'apiKey':
      if ('name' in scheme && scheme.name) {
        return `ApiKey realm="${REALM}", error="invalid_token", error_description="Invalid or missing API key", name="${scheme.name}"`
      }

      return null
    case 'oauth2':
    case 'openIdConnect':
      return `Bearer realm="${REALM}", error="invalid_token", error_description="The access token is invalid or has expired"`
    default:
      return null
  }
}

/** Resolve all schemes referenced by a single security requirement object. */
function resolveSchemes(
  requirement: OpenAPIV3.SecurityRequirementObject,
  schema?: OpenAPIV3_1.Document,
): OpenAPIV3_1.SecuritySchemeObject[] {
  return Object.keys(requirement)
    .map((name) => getResolvedRef(schema?.components?.securitySchemes?.[name]))
    .filter((scheme): scheme is OpenAPIV3_1.SecuritySchemeObject => Boolean(scheme) && 'type' in (scheme ?? {}))
}

/**
 * Handles authentication for incoming requests based on the OpenAPI document.
 *
 * The `security` array is evaluated as OR-of-ANDs: the request is authenticated if
 * *any* requirement object is fully satisfied, and a requirement object is satisfied
 * only when *every* scheme it lists is satisfied. An empty requirement object (`{}`)
 * means authentication is optional and always passes.
 */
export function handleAuthentication(schema?: OpenAPIV3_1.Document, operation?: OpenAPIV3_1.OperationObject) {
  return async (c: Context, next: () => Promise<void>): Promise<Response | void> => {
    // Operation-level security overrides the global security requirement.
    const security = operation?.security ?? schema?.security

    // Nothing to enforce.
    if (!security || security.length === 0) {
      await next()
      return
    }

    const isAuthenticated = security.some((requirement: OpenAPIV3.SecurityRequirementObject) => {
      const schemeNames = Object.keys(requirement)

      // An empty requirement object makes authentication optional.
      if (schemeNames.length === 0) {
        return true
      }

      // Every scheme listed in the requirement must resolve and be satisfied (AND).
      // A name that does not resolve to a valid scheme makes the whole requirement
      // unsatisfiable, so a missing scheme cannot be silently skipped.
      return schemeNames.every((name) => {
        const scheme = getResolvedRef(schema?.components?.securitySchemes?.[name])

        if (!scheme || !('type' in scheme)) {
          return false
        }

        return isSchemeSatisfied(scheme as OpenAPIV3_1.SecuritySchemeObject, c)
      })
    })

    if (isAuthenticated) {
      await next()
      return
    }

    // Advertise a challenge for every scheme that could satisfy the request.
    const challenges = new Set<string>()
    for (const requirement of security) {
      for (const scheme of resolveSchemes(requirement, schema)) {
        const challenge = getChallenge(scheme)
        if (challenge) {
          challenges.add(challenge)
        }
      }
    }

    for (const challenge of challenges) {
      c.header('WWW-Authenticate', challenge, { append: true })
    }

    return c.json(
      {
        error: 'Unauthorized',
        message: 'Authentication is required to access this resource.',
      },
      401,
    )
  }
}
