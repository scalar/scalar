/**
 * Style Values
 *
 * In order to support common ways of serializing simple parameters, a set of `style` values are defined.  | `style` | [`type`](#data-types) | `in` | Comments | | ---- | ---- | ---- | ---- | | matrix | `primitive`, `array`, `object` | `path` | Path-style parameters defined by [RFC6570](https://tools.ietf.org/html/rfc6570#section-3.2.7) | | label | `primitive`, `array`, `object` | `path` | Label style parameters defined by [RFC6570](https://tools.ietf.org/html/rfc6570#section-3.2.5) | | simple | `primitive`, `array`, `object` | `path`, `header` | Simple style parameters defined by [RFC6570](https://tools.ietf.org/html/rfc6570#section-3.2.2). This option replaces `collectionFormat` with a `csv` value from OpenAPI 2.0. | | form | `primitive`, `array`, `object` | `query`, `cookie` | Form style parameters defined by [RFC6570](https://tools.ietf.org/html/rfc6570#section-3.2.8). This option replaces `collectionFormat` with a `csv` (when `explode` is false) or `multi` (when `explode` is true) value from OpenAPI 2.0. | | spaceDelimited | `array`, `object` | `query` | Space separated array values or object properties and values. This option replaces `collectionFormat` equal to `ssv` from OpenAPI 2.0. | | pipeDelimited | `array`, `object` | `query` | Pipe separated array values or object properties and values. This option replaces `collectionFormat` equal to `pipes` from OpenAPI 2.0. | | deepObject | `object` | `query` | Allows objects with scalar properties to be represented using form parameters. The representation of array or object properties is not defined. |
 *
 * @see {@link https://spec.openapis.org/oas/v3.1#style-values}
 */
export type StylesForFormObject = {
  style: 'form'
  explode: boolean
}
