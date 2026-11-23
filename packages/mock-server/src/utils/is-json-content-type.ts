import { isJsonMediaType } from '@scalar/helpers/http/is-json-media-type'

/**
 * Whether a request `Content-Type` header carries a JSON body.
 *
 * Matches `application/json` and structured `+json` types such as `application/vnd.api+json` or
 * `application/merge-patch+json`, case-insensitively and ignoring parameters like `charset`. An
 * empty or absent header is treated as JSON to stay forgiving with clients that omit it.
 *
 * Request validation and handler body parsing share this check, so a body that passes validation is
 * always delivered to the handler as `req.body`.
 */
export const isJsonContentType = (contentType: string | undefined): boolean =>
  !contentType?.trim() || isJsonMediaType(contentType)
