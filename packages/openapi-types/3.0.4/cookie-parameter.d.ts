/**
 * Parameter object
 *
 * Describes a single operation parameter.  A unique parameter is defined by a combination of a [name](#parameter-name) and [location](#parameter-in).  See [Appendix E](#appendix-e-percent-encoding-and-form-media-types) for a detailed examination of percent-encoding concerns, including interactions with the `application/x-www-form-urlencoded` query string format.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4#parameter-object}
 */
export type CookieParameterObject = {
  /** **REQUIRED**. The location of the parameter. Possible values are `"query"`, `"header"`, `"path"` or `"cookie"`. */
  in?: 'cookie'
  /** Describes how the parameter value will be serialized depending on the type of the parameter value. Default values (based on value of `in`): for `"query"` - `"form"`; for `"path"` - `"simple"`; for `"header"` - `"simple"`; for `"cookie"` - `"form"`. */
  style?: 'form'
}
