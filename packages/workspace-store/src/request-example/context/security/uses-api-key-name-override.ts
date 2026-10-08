import { isObjectLike } from '@scalar/helpers/object/is-object'

/**
 * Whether API key name edits for a scheme live in the auth store instead of the document.
 *
 * The document owns the name unless the configuration supplies one, or the scheme only exists in the
 * configuration. The mutator and the merge share this rule, so an override left behind after the
 * configuration changes cannot hide the document name.
 */
export const usesApiKeyNameOverride = (configuredScheme: unknown, documentScheme: unknown): boolean =>
  isObjectLike(configuredScheme) && (configuredScheme.name !== undefined || !isObjectLike(documentScheme))
