import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import http from './http'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order. The registry is a module-level singleton, so
// registering the same grammar twice is harmless and visible to the whole run.
registerLanguage(http)

const known = new Set(Object.keys(SCOPES))

/**
 * Tokens as the renderer sees them: adjacent ranges sharing a scope are one
 * run, so a quoted string is `"abc"` rather than three separate pieces.
 */
const runs = (code: string, lang: string): [string, string | null][] => {
  const out: [string, string | null][] = []
  for (const token of tokenize(code, lang)) {
    const last = out[out.length - 1]
    if (last && last[1] === token.scope) last[0] += token.text
    else out.push([token.text, token.scope])
  }
  return out
}

/** All (text, scope) pairs for runs that carry a scope. */
const scoped = (code: string, lang: string): [string, string][] => {
  return runs(code, lang).filter((r) => r[1] !== null) as [string, string][]
}

const assertHas = (code: string, lang: string, text: string, scope: string): void => {
  const pairs = scoped(code, lang)
  expect(
    pairs.some(([t, s]) => t === text && s === scope),
    `expected ${JSON.stringify(text)} to be ${scope} in ${lang}, got ${JSON.stringify(
      pairs.filter(([t]) => t === text),
    )}`,
  ).toBeTruthy()
}

/**
 * A session the way API documentation shows one: two requests and their
 * responses in a single `.http`-style document.
 *
 * It carries the things that break a regex-based tokenizer on this format —
 * the blank line between headers and body, header values full of colons and
 * commas, a query string, JSON numbers in every literal form, escapes inside
 * body strings, and a second message starting after a body has run.
 */
const SAMPLE = `# Example session against the billing API.

### Create a customer
POST /v1/customers?expand=subscriptions&locale=en-US&dry_run HTTP/1.1
Host: api.example.com:8443
Content-Type: application/json; charset=utf-8
Accept: application/json, text/plain;q=0.9, */*;q=0.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.abc
If-None-Match: "33a64df551425fcc55e"
Content-Length: 348

{
  "name": "Ada \\"Countess\\" Lovelace",
  "note": "first line\\nsecond line, with a \\u00e9 escape",
  "balance": -1250,
  "discount": 0.075,
  "credit_limit": 1.2e4,
  "retries": 3,
  "active": true,
  "deleted_at": null,
  "tags": ["vip", "beta"],
  "address": {
    "line1": "1 Infinite Loop",
    "postal_code": "95014"
  }
}

HTTP/1.1 201 Created
Date: Mon, 06 Jan 2026 15:04:05 GMT
Content-Type: application/json
Location: https://api.example.com/v1/customers/cus_00042
Cache-Control: no-store, max-age=0
Set-Cookie: session=a3fWa; Path=/; Expires=Wed, 21 Oct 2026 07:28:00 GMT; HttpOnly
Content-Length: 96

{
  "id": "cus_00042",
  "object": "customer",
  "created": 1767711845,
  "livemode": false
}

### Fetch it back
GET /v1/customers/cus_00042 HTTP/2
Host: api.example.com
Accept: */*

### The failure shape, for reference
// A 404 body is problem+json, not the customer object.
HTTP/1.1 404 Not Found
Content-Type: application/problem+json
Content-Length: 74

{"type": "https://example.com/probs/missing", "title": "No such customer"}
`

describe('http', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'http')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'http')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'http')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `http emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(SAMPLE, 'http')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // Every prefix, not a sample of them: a message is a stack of states that
    // only unwind at a line end, so the interesting truncations are the ones
    // mid-header and mid-body-string, and they are one character apart.
    for (let end = 0; end <= SAMPLE.length; end++) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'http')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('separates the method from the target it acts on', () => {
    assertHas(SAMPLE, 'http', 'POST', 'keyword.control')
    assertHas(SAMPLE, 'http', '/v1/customers', 'link')
  })

  it('breaks a query string into parameters', () => {
    assertHas(SAMPLE, 'http', '?', 'punctuation.delimiter')
    assertHas(SAMPLE, 'http', 'expand', 'variable.parameter')
    assertHas(SAMPLE, 'http', 'subscriptions', 'link')
  })

  it('separates the status code from the reason phrase', () => {
    assertHas(SAMPLE, 'http', '404', 'number')
    assertHas(SAMPLE, 'http', 'Not Found', 'constant')
  })

  it('scopes the protocol version in pieces', () => {
    assertHas(SAMPLE, 'http', 'HTTP', 'keyword')
    assertHas(SAMPLE, 'http', '1.1', 'number')
  })

  it('separates a header name from its value', () => {
    assertHas(SAMPLE, 'http', 'Content-Length', 'property')
    assertHas(SAMPLE, 'http', 'application/problem+json', 'string')
  })

  it('leaves a colon inside a header value to the value', () => {
    // The value keeps its own `:`, and only the port on the far side of it
    // reads as a number.
    assertHas(SAMPLE, 'http', 'api.example.com:', 'string')
    assertHas(SAMPLE, 'http', '8443', 'number')
  })

  it('picks parameters out of a header value', () => {
    assertHas(SAMPLE, 'http', 'q', 'variable.parameter')
    assertHas(SAMPLE, 'http', '0.9', 'number')
    // `utf-8` is one token, not a name and a number.
    assertHas(SAMPLE, 'http', 'utf-8', 'string')
  })

  it('highlights JSON in the body after the blank line', () => {
    assertHas(SAMPLE, 'http', '"balance"', 'property')
    assertHas(SAMPLE, 'http', '-1250', 'number')
    assertHas(SAMPLE, 'http', '1.2e4', 'number')
    assertHas(SAMPLE, 'http', 'null', 'constant.builtin')
  })

  it('scopes escapes inside a body string', () => {
    assertHas(SAMPLE, 'http', '\\"', 'string.escape')
    assertHas(SAMPLE, 'http', '\\u00e9', 'string.escape')
  })

  it('reads a URL in a header value as a link', () => {
    assertHas(SAMPLE, 'http', 'https://api.example.com/v1/customers/cus_00042', 'link')
  })

  it('resumes at the message after a body', () => {
    assertHas(SAMPLE, 'http', '### Fetch it back', 'comment')
    assertHas(SAMPLE, 'http', 'GET', 'keyword.control')
    assertHas(SAMPLE, 'http', '/v1/customers/cus_00042', 'link')
  })

  it('scopes a comment introducing the next message, but not a `#` inside a body', () => {
    // The canonical `.http` layout puts a comment before each request. The
    // second one sits after a body, so the body state has to recognise it —
    // without mistaking an ordinary `#` line of body data for a separator.
    const between = '# Get the user\nGET /users/1 HTTP/1.1\n\n# Create a user\nPOST /users HTTP/1.1\n'
    assertHas(between, 'http', '# Get the user', 'comment')
    assertHas(between, 'http', '# Create a user', 'comment')
    assertHas('GET /a HTTP/1.1\n\n// next\nGET /b HTTP/1.1\n', 'http', '// next', 'comment')

    const data = 'POST /x HTTP/1.1\n\nplain body\n# not a separator\nmore body\n'
    expect(scoped(data, 'http').some(([, s]) => s === 'comment')).toBeFalsy()
  })

  it('finds the body across CRLF line endings', () => {
    // The line endings a real message uses. JavaScript counts a lone `\r` as a
    // line terminator, so an anchored "empty line" pattern would treat every
    // CRLF as the end of the headers and read the rest as body.
    const code = 'POST /x HTTP/1.1\r\nHost: h\r\n\r\n{"a": 1}\r\n'
    assertHas(code, 'http', 'Host', 'property')
    assertHas(code, 'http', 'h', 'string')
    assertHas(code, 'http', '"a"', 'property')
  })

  it('does not read a body line as a header', () => {
    // The blank line is the whole difference between a header and body text.
    const code = 'POST /x HTTP/1.1\nHost: h\n\nTotal: 42\n'
    assertHas(code, 'http', 'Host', 'property')
    const pairs = scoped(code, 'http')
    expect(pairs.some(([t, s]) => t === 'Total' && s === 'property')).toBeFalsy()
  })

  it('does not let an unterminated body string swallow the rest of the document', () => {
    const code = 'HTTP/1.1 200 OK\n\n{"a": "oops\n\n### next\nGET /x HTTP/1.1\n'
    assertHas(code, 'http', 'GET', 'keyword.control')
  })
})
