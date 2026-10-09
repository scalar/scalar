/** RFC 9110 token grammar, shared by HTTP method and header token validation. */
export const HTTP_TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/
