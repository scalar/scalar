/**
 * Server Variable object
 *
 * An object representing a Server Variable for server URL template substitution.  The server URL templating is defined by the following [ABNF](https://tools.ietf.org/html/rfc5234) syntax.  ```abnf server-url-template  = 1*( literals / server-variable ) server-variable      = "{" server-variable-name "}" server-variable-name = 1*( %x00-7A / %x7C / %x7E-10FFFF ) ; every Unicode character except { and }  literals       = 1*( %x21 / %x23-24 / %x26-3B / %x3D / %x3F-5B                / %x5D / %x5F / %x61-7A / %x7E / ucschar / iprivate                / pct-encoded)                     ; any Unicode character except: CTL, SP,                     ;  DQUOTE, "%" (aside from pct-encoded),                     ;  "<", ">", "\", "^", "`", "{", "|", "}" pct-encoded    =  "%" HEXDIG HEXDIG ucschar        =  %xA0-D7FF / %xF900-FDCF / %xFDF0-FFEF                /  %x10000-1FFFD / %x20000-2FFFD / %x30000-3FFFD                /  %x40000-4FFFD / %x50000-5FFFD / %x60000-6FFFD                /  %x70000-7FFFD / %x80000-8FFFD / %x90000-9FFFD                /  %xA0000-AFFFD / %xB0000-BFFFD / %xC0000-CFFFD                /  %xD0000-DFFFD / %xE1000-EFFFD iprivate       =  %xE000-F8FF / %xF0000-FFFFD / %x100000-10FFFD ```  Here, `literals`, `pct-encoded`, `ucschar` and `iprivate` definitions are taken from [RFC 6570](https://www.rfc-editor.org/rfc/rfc6570), incorporating the corrections specified in [Errata 6937](https://www.rfc-editor.org/errata/eid6937) for `literals`.  Each server variable MUST NOT appear more than once in the URL template.  See the [Paths Object](#paths-object) for guidance on constructing full request URLs.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2#server-variable-object}
 */
export type ServerVariableObject = {
  /** An enumeration of string values to be used if the substitution options are from a limited set. The array MUST NOT be empty. */
  enum?: string[]
  /** **REQUIRED**. The default value to use for substitution, which SHALL be sent if an alternate value is _not_ supplied. If the [`enum`](https://spec.openapis.org/oas/v3.2#server-variable-enum) is defined, the value MUST exist in the enum's values. Note that this behavior is different from the [Schema Object](https://spec.openapis.org/oas/v3.2#schema-object)'s `default` keyword, which documents the receiver's behavior rather than inserting the value into the data. */
  default: string
  /** An optional description for the server variable. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
} & Record<`x-${string}`, unknown>
