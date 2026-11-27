import type { OAuthFlow } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** A PKCE method the workspace store accepts for the `x-usePkce` extension. */
export type PkceOption = Extract<OAuthFlow, { 'x-usePkce': unknown }>['x-usePkce']

/**
 * Every PKCE method, keyed by value.
 *
 * `satisfies Record<PkceOption, true>` makes the list exhaustive: if the workspace store adds a
 * method to `x-usePkce` or drops one, this object stops type-checking until it matches. A plain
 * array could only check that each entry is valid, not that none is missing.
 */
const PKCE_METHODS = {
  'SHA-256': true,
  plain: true,
  no: true,
} satisfies Record<PkceOption, true>

/**
 * The PKCE methods, in the order the dropdown lists them.
 *
 * They live here rather than coming from `@scalar/types/entities`, because that module builds its
 * Zod schemas as soon as it loads, which would put all of Zod into the initial API Reference bundle
 * just for this list.
 */
export const PKCE_OPTIONS = Object.keys(PKCE_METHODS) as readonly PkceOption[]

/** Narrows a dropdown value to a PKCE method, so the form never writes anything else. */
export const isPkceOption = (value: string): value is PkceOption => Object.hasOwn(PKCE_METHODS, value)
