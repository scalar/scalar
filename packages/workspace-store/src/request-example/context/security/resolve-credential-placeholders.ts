import { CREDENTIAL_PLACEHOLDER_FIELDS } from '@scalar/helpers/http/credential-placeholder-fields'
import { isObject } from '@scalar/helpers/object/is-object'
import { encode } from 'js-base64'

import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'
import type {
  CredentialPlaceholderField,
  XScalarCredentialPlaceholders,
} from '@/schemas/extensions/security/x-scalar-credential-placeholders'

/** The original template remains in the document; these values are only used for rendering and copying. */
export type ResolvedCredentialPlaceholders = {
  content: string
  displayContent: string
}

type CredentialValues = Partial<Record<CredentialPlaceholderField, string>>
type Binding = { value: string; mask: boolean }

/** Use the same OAuth flow as the request builder, never credentials from inactive flows. */
const getCredentialValues = (scheme: SecuritySchemeObjectSecret): CredentialValues => {
  if (scheme.type === 'apiKey') {
    return { token: scheme['x-scalar-secret-token'] }
  }
  if (scheme.type === 'http') {
    return scheme.scheme === 'basic'
      ? { username: scheme['x-scalar-secret-username'], password: scheme['x-scalar-secret-password'] }
      : { token: scheme['x-scalar-secret-token'] }
  }
  if (scheme.type === 'oauth2' || scheme.type === 'openIdConnect') {
    const flow = Object.values(scheme.flows ?? {}).find((flow) => flow?.['x-scalar-secret-token'])
    if (!flow) {
      return {}
    }
    return {
      token: flow['x-scalar-secret-token'],
      clientId: flow['x-scalar-secret-client-id'],
      clientSecret: 'x-scalar-secret-client-secret' in flow ? flow['x-scalar-secret-client-secret'] : undefined,
      username: 'x-scalar-secret-username' in flow ? flow['x-scalar-secret-username'] : undefined,
      password: 'x-scalar-secret-password' in flow ? flow['x-scalar-secret-password'] : undefined,
    }
  }
  return {}
}

/**
 * Insert explicitly declared {{name}} placeholders from the selected security schemes.
 * Missing values and ambiguous names stay unchanged. Substitutions are literal, single-pass,
 * and never written back to the API description. Masking is separate from copyable content.
 */
export const resolveCredentialPlaceholders = (
  template: string,
  securitySchemes: SecuritySchemeObjectSecret[],
): ResolvedCredentialPlaceholders => {
  const bindings = new Map<string, Binding | null>()
  const maskedValues = new Set<string>()

  for (const scheme of securitySchemes) {
    const values = getCredentialValues(scheme)
    const extension = (scheme as SecuritySchemeObjectSecret & XScalarCredentialPlaceholders)[
      'x-scalar-credential-placeholders'
    ]
    const mappings = isObject(extension) ? Object.entries(extension) : []

    // A public field must never unmask an equal value belonging to another secret field.
    for (const [field, value] of Object.entries(values)) {
      if (!value) {
        continue
      }
      const fieldMappings = mappings.filter(([, mapping]) => isObject(mapping) && mapping.field === field)
      if (!fieldMappings.length || fieldMappings.some(([, mapping]) => mapping.mask !== false)) {
        maskedValues.add(value)
      }
    }
    if (scheme.type === 'http' && scheme.scheme === 'basic') {
      maskedValues.add(encode(`${values.username ?? ''}:${values.password ?? ''}`))
    }

    for (const [name, mapping] of mappings) {
      if (!isObject(mapping) || !CREDENTIAL_PLACEHOLDER_FIELDS.some((field) => field === mapping.field)) {
        continue
      }
      const value = values[mapping.field]
      bindings.set(name, bindings.has(name) || !value ? null : { value, mask: mapping.mask !== false })
    }
  }

  // Resolve each string once so placeholder-like text inside credentials stays literal.
  const replace = (mask: boolean): string =>
    template.replace(/\{\{([A-Za-z_][A-Za-z0-9_.-]*)\}\}/g, (placeholder: string, name: string): string => {
      const binding = bindings.get(name)
      if (!binding) {
        return placeholder
      }
      return mask && (binding.mask || [...maskedValues].some((secret) => secret && binding.value.includes(secret)))
        ? '••••••••'
        : binding.value
    })

  return { content: replace(false), displayContent: replace(true) }
}
