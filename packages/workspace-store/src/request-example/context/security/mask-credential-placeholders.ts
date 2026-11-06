import type { resolveCredentialPlaceholders } from './resolve-credential-placeholders'

/** Mask inserted credentials before HTML escaping or highlighting can split their values. */
export const maskCredentialPlaceholders = (resolved: ReturnType<typeof resolveCredentialPlaceholders>): string =>
  resolved.segments
    .map((segment) =>
      segment.credential && resolved.maskedValues.some((secret) => secret && segment.value.includes(secret))
        ? '••••••••'
        : segment.value,
    )
    .join('')
