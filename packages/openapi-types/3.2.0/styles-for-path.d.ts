/**
 * Style Values
 *
 * In order to support common ways of serializing simple parameters, a set of `style` values are defined. Combinations not represented in this table are not permitted.  | `style` | [`type`](#data-types) | `in` | Comments | | ---- | ---- | ---- | ---- | | `matrix` | primitive, `array`, `object` | `path` | Path-style parameters defined by [RFC6570](https://tools.ietf.org/html/rfc6570#section-3.2.7) | | `label` | primitive, `array`, `object` | `path` | Label style parameters defined by [RFC6570](https://tools.ietf.org/html/rfc6570#section-3.2.5) | | `simple` | primitive, `array`, `object` | `path`, `header` | Simple style parameters defined by [RFC6570](https://tools.ietf.org/html/rfc6570#section-3.2.2). This option replaces `collectionFormat` with a `csv` value from OpenAPI 2.0. | | `form` | primitive, `array`, `object` | `query`, `cookie` | Form style parameters defined by [RFC6570](https://tools.ietf.org/html/rfc6570#section-3.2.8). This option replaces `collectionFormat` with a `csv` (when `explode` is false) or `multi` (when `explode` is true) value from OpenAPI 2.0. | | `spaceDelimited` | `array`, `object` | `query` | Space separated array values or object properties and values. This option replaces `collectionFormat` equal to `ssv` from OpenAPI 2.0. | | `pipeDelimited` | `array`, `object` | `query` | Pipe separated array values or object properties and values. This option replaces `collectionFormat` equal to `pipes` from OpenAPI 2.0. | | `deepObject` | `object` | `query` | Allows objects with scalar properties to be represented using form parameters. The representation of array or object properties is not defined (but see [Extending Support for Querystring Formats](#extending-support-for-querystring-formats) for alternatives). | | `cookie` | primitive, `array`, `object` | `cookie` | Analogous to `form`, but following [[RFC6265]] `Cookie` syntax rules, meaning that name-value pairs are separated by a semicolon followed by a single space (e.g. `n1=v1; n2=v2`), and no percent-encoding or other escaping is applied; data values that require any sort of escaping MUST be provided in escaped form. |
 *
 * @see {@link https://spec.openapis.org/oas/v3.1#style-values}
 */
export type StylesForPathObject = {
  in: 'path'
  name: unknown
  style: 'matrix' | 'label' | 'simple'
  required: true
  explode: boolean
  allowReserved: boolean
}
