import type { buildRequestSecurity } from '@scalar/workspace-store/request-example'
import { encode as encodeBase64 } from 'js-base64'

/** Remove saved credentials from JSON-visible response fields before truncation or model submission. */
export const createSecretRedactor = (security: ReturnType<typeof buildRequestSecurity>): (<T>(value: T) => T) => {
  const secrets = [
    ...new Set(
      security.flatMap(({ value, format }) => {
        // Basic usernames are identifiers and can appear in unrelated response text.
        const values = format === 'basic' ? [value, value.slice(value.indexOf(':') + 1), encodeBase64(value)] : [value]
        return values
          .filter(Boolean)
          .flatMap((secret) => [
            secret,
            encodeURIComponent(secret),
            new URLSearchParams({ value: secret }).toString().slice('value='.length),
          ])
      }),
    ),
  ].sort((a, b) => b.length - a.length)

  // Match all secrets in one pass so overlapping values do not partially redact each other.
  const pattern = secrets.length
    ? new RegExp(secrets.map((secret) => secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')
    : undefined

  return <T>(value: T): T => {
    if (!pattern || value === undefined) {
      return value
    }
    // Work on decoded JSON string tokens, including object keys, without changing JSON syntax or scalar types.
    return JSON.parse(
      JSON.stringify(value).replace(/"(?:\\.|[^"\\])*"/g, (token) => {
        const text: string = JSON.parse(token)
        return JSON.stringify(text.replace(pattern, '[REDACTED]'))
      }),
    )
  }
}
