import { encode } from 'js-base64'

/** Encode OAuth client passwords using form encoding before Basic authentication (RFC6749 section 2.3.1). */
export const oauthClientAuthorization = (clientId: string, clientSecret: string): string => {
  const formEncode = (value: string): string => new URLSearchParams({ value }).toString().slice('value='.length)
  return `Basic ${encode(`${formEncode(clientId)}:${formEncode(clientSecret)}`)}`
}
