import type { Context } from 'hono'

const REALM = 'Scalar Mock Server'
const NONCE = 'scalar-mock-nonce'

/** A deterministic challenge lets HTTP clients exercise Digest without a credential database. */
export const DIGEST_CHALLENGE = `Digest realm="${REALM}", nonce="${NONCE}", algorithm=MD5, qop="auth"`

/** Validate the Digest exchange shape, like the mock's Basic and Bearer credential checks. */
export const isValidDigestAuth = (c: Context): boolean => {
  const header = c.req.header('Authorization')
  if (!header || !/^Digest\s+/i.test(header)) {
    return false
  }
  const parameters = new Map<string, string>()
  const input = header.replace(/^Digest\s+/i, '')
  const pattern = /\s*([\w-]+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|([^\s,]+))\s*(?:,|$)/gy
  let consumed = 0
  for (const match of input.matchAll(pattern)) {
    const name = match[1]!.toLowerCase()
    if (parameters.has(name)) {
      return false
    }
    parameters.set(name, (match[2] ?? match[3] ?? '').replace(/\\(.)/g, '$1'))
    consumed = match.index + match[0].length
  }
  const url = new URL(c.req.url)
  return (
    consumed === input.length &&
    Boolean(parameters.get('username')) &&
    parameters.get('realm') === REALM &&
    parameters.get('nonce') === NONCE &&
    parameters.get('uri') === `${url.pathname}${url.search}` &&
    (parameters.get('algorithm') ?? 'MD5').toUpperCase() === 'MD5' &&
    parameters.get('qop') === 'auth' &&
    Boolean(parameters.get('cnonce')) &&
    /^[0-9a-f]{8}$/i.test(parameters.get('nc') ?? '') &&
    parameters.get('nc') !== '00000000' &&
    /^[0-9a-f]{32}$/i.test(parameters.get('response') ?? '')
  )
}
