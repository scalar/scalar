export type XScalarCookie = {
  name: string
  value: string
  domain?: string
  path?: string
  isDisabled?: boolean
}

export type XScalarCookies = {
  'x-scalar-cookies'?: XScalarCookie[]
}
