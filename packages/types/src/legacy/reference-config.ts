type OptionalCharset = string | null

export type ContentType =
  | `application/json${OptionalCharset}`
  | `application/xml${OptionalCharset}`
  | `text/plain${OptionalCharset}`
  | `text/html${OptionalCharset}`
  | `application/octet-stream${OptionalCharset}`
  | `application/x-www-form-urlencoded${OptionalCharset}`
  | `multipart/form-data${OptionalCharset}`
  | `*/*${OptionalCharset}`
  | `application/vnd.${string}+json${OptionalCharset}`

export enum XScalarStability {
  Deprecated = 'deprecated',
  Experimental = 'experimental',
  Stable = 'stable',
}

export type Heading = {
  depth: number
  value: string
  slug?: string
}
