import { isObjectLike } from '@scalar/helpers/object/is-object'
import { objectEntries } from '@scalar/helpers/object/object-entries'
import { Type } from '@scalar/typebox'
import type { AuthenticationConfiguration } from '@scalar/types/api-reference'
import type { AsyncApiComponentsObject, AsyncApiSecuritySchemeObject } from '@scalar/types/asyncapi/3.1'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  type ComponentsObject,
  type SecuritySchemeObject,
  SecuritySchemeObjectSchema,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { isEncryptionSchemeType, isSaslSchemeType } from '@/request-example/builder/security/broker-scheme-types'
import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'

import { extractSecuritySchemeSecrets } from './extract-security-scheme-secrets'

/** Document security merged with the config security schemes */
export type MergedSecuritySchemes = Record<string, SecuritySchemeObjectSecret>

const hasAvailableScopes = (flow: unknown): flow is Record<string, unknown> => {
  const resolved = getResolvedRef(flow)
  return resolved !== null && typeof resolved === 'object' && 'availableScopes' in resolved
}

/**
 * Rename each AsyncAPI OAuth2 flow's `availableScopes` map onto OpenAPI's `scopes`.
 *
 * AsyncAPI and OpenAPI use the same scope-name → description map, but under different keys. The
 * auth UI reads `flow.scopes`, so without this rename an AsyncAPI OAuth2 scheme would render with
 * no selectable scopes. Flows that already use `scopes` (OpenAPI) are returned untouched, so this
 * is a no-op for OpenAPI schemes.
 */
const normalizeAsyncApiOAuthFlows = (flows: unknown): unknown => {
  const resolvedFlows = getResolvedRef(flows)
  if (!resolvedFlows || typeof resolvedFlows !== 'object') {
    return flows
  }

  const entries = Object.entries(resolvedFlows)
  if (!entries.some(([, flowValue]) => hasAvailableScopes(flowValue))) {
    return flows
  }

  return Object.fromEntries(
    entries.map(([flowKey, flowValue]) => {
      if (!hasAvailableScopes(flowValue)) {
        return [flowKey, flowValue]
      }

      // Prefer an OpenAPI-native `scopes` map if one is somehow already present, so we never drop it.
      const resolved = getResolvedRef(flowValue)
      if (!isObjectLike(resolved)) return [flowKey, flowValue]
      const { availableScopes, scopes: existingScopes, ...rest } = resolved
      return [flowKey, { ...rest, scopes: existingScopes ?? availableScopes ?? {} }]
    }),
  )
}

/**
 * Map AsyncAPI-only security scheme shapes onto their OpenAPI equivalents where one exists.
 *
 * AsyncAPI's `httpApiKey` (a named key in `query`/`header`/`cookie`) is structurally identical to
 * OpenAPI's `apiKey`, so we rename the type and let the shared apiKey path handle rendering and
 * request injection. AsyncAPI OAuth2 flows carry their scope map under `availableScopes`, which we
 * rename to OpenAPI's `scopes`. Everything else is returned unchanged — including AsyncAPI's own
 * `apiKey` (`in: user | password`, no name), which has no OpenAPI counterpart and is value-only.
 */
const normalizeAsyncApiSecurityScheme = (scheme: unknown): unknown => {
  if (!(scheme && typeof scheme === 'object' && 'type' in scheme)) {
    return scheme
  }

  // HTTP authentication scheme names are case-insensitive, but the strict schema uses lowercase literals.
  if (scheme.type === 'http' && 'scheme' in scheme && typeof scheme.scheme === 'string') {
    return { ...scheme, scheme: scheme.scheme.toLowerCase() }
  }

  if (scheme.type === 'httpApiKey') {
    return { ...scheme, type: 'apiKey' }
  }

  if (scheme.type === 'oauth2' && 'flows' in scheme && scheme.flows) {
    const normalizedFlows = normalizeAsyncApiOAuthFlows(scheme.flows)
    if (normalizedFlows !== scheme.flows) {
      return { ...scheme, flows: normalizedFlows }
    }
  }

  return scheme
}

/**
 * Merge the authentication config with the document security schemes + the auth store secrets.
 *
 * AsyncAPI keeps its security schemes in the same `components.securitySchemes` slot and shares the
 * `http`/`apiKey`/`oauth2`/`openIdConnect` shapes with OpenAPI, so we accept either spec's schemes
 * here. HTTP schemes are coerced into the OpenAPI shape, while broker credentials retain their
 * AsyncAPI type and location.
 */
export const mergeSecurity = (
  documentSecuritySchemes:
    | ComponentsObject['securitySchemes']
    | NonNullable<AsyncApiComponentsObject['securitySchemes']> = {},
  configSecuritySchemes: AuthenticationConfiguration['securitySchemes'] = {},
  authStore: AuthStore,
  documentName: string,
  oauth2RedirectUri?: string,
): MergedSecuritySchemes => {
  /** Resolve any refs in the document security schemes */
  const resolvedDocumentSecuritySchemes = objectEntries(documentSecuritySchemes).reduce<
    Record<string, SecuritySchemeObject | AsyncApiSecuritySchemeObject>
  >((acc, [key, value]) => {
    const resolved = deepClone(getResolvedRef(value))
    if (resolved) {
      acc[key] = resolved
    }
    return acc
  }, {})

  /** Merge the config security schemes into the document security schemes */
  const mergedSchemes = mergeObjects(resolvedDocumentSecuritySchemes, configSecuritySchemes)

  /** Convert the config secrets to the new secret extensions */
  return objectEntries(mergedSchemes).reduce<MergedSecuritySchemes>((acc, [name, value]) => {
    // Fold AsyncAPI-only types (e.g. `httpApiKey`) onto their OpenAPI equivalents before coercing,
    // so the downstream apiKey/http/oauth2 machinery recognises them instead of rejecting the type.
    const scheme = normalizeAsyncApiSecurityScheme(value)
    // Broker schemes have no OpenAPI equivalent. Validate their shared fields separately so
    // coercion cannot turn a broker credential into an HTTP authentication scheme.
    const type = isObjectLike(scheme) && typeof scheme.type === 'string' ? scheme.type : undefined
    if (isSaslSchemeType(type) || isEncryptionSchemeType(type) || type === 'X509' || type === 'gssapi') {
      const broker = coerceValue(
        Type.Object({
          description: Type.Optional(Type.String()),
          username: Type.Optional(Type.String()),
          password: Type.Optional(Type.String()),
          token: Type.Optional(Type.String()),
        }),
        scheme,
      )
      acc[name] = extractSecuritySchemeSecrets({ ...broker, type }, authStore, name, documentName, oauth2RedirectUri)
      return acc
    }
    if (isObjectLike(scheme) && scheme.type === 'apiKey' && (scheme.in === 'user' || scheme.in === 'password')) {
      const broker = coerceValue(
        Type.Object({
          description: Type.Optional(Type.String()),
          name: Type.Optional(Type.String()),
          value: Type.Optional(Type.String()),
        }),
        scheme,
      )
      acc[name] = extractSecuritySchemeSecrets(
        { ...broker, type: 'apiKey', in: scheme.in },
        authStore,
        name,
        documentName,
        oauth2RedirectUri,
      )
      return acc
    }
    // We coerce in case the scheme is missing any key fields like type.
    const coerced = coerceValue(SecuritySchemeObjectSchema, scheme)
    const merged = { ...(isObjectLike(scheme) ? scheme : {}), ...coerced }
    acc[name] = extractSecuritySchemeSecrets(merged, authStore, name, documentName, oauth2RedirectUri)
    return acc
  }, {})
}
