import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { registerLanguage, tokenize } from '../index'
import curl from './curl'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order.
registerLanguage(curl)

const known = new Set(Object.keys(SCOPES))

/** Tokens as the renderer sees them: adjacent ranges sharing a scope are one run. */
const runs = (code: string): [string, string | null][] => {
  const out: [string, string | null][] = []
  for (const token of tokenize(code, 'curl')) {
    const last = out[out.length - 1]
    if (last && last[1] === token.scope) {
      last[0] += token.text
    } else {
      out.push([token.text, token.scope])
    }
  }
  return out
}

/** All (text, scope) pairs for runs that carry a scope. */
const scoped = (code: string): [string, string][] => runs(code).filter((r) => r[1] !== null) as [string, string][]

const assertHas = (code: string, text: string, scope: string): void => {
  const pairs = scoped(code)
  expect(
    pairs.some(([t, s]) => t === text && s === scope),
    `expected ${JSON.stringify(text)} to be ${scope}, got ${JSON.stringify(pairs.filter(([t]) => t === text))}`,
  ).toBeTruthy()
}

const REQUEST = `curl https://galaxy.scalar.com/planets \\
  --request POST \\
  --header 'Content-Type: application/json' \\
  --data '{"name":"Mars"}'`

describe('curl', () => {
  it('round-trips the source exactly', () => {
    expect(
      runs(REQUEST)
        .map(([text]) => text)
        .join(''),
    ).toBe(REQUEST)
  })

  it('only emits scopes the vocabulary defines', () => {
    for (const [, scope] of scoped(REQUEST)) {
      expect(known.has(scope), `unknown scope ${scope}`).toBe(true)
    }
  })

  it('scopes the command itself', () => {
    assertHas(REQUEST, 'curl', 'keyword')
  })

  it('scopes the request method apart from the flag that carries it', () => {
    assertHas(REQUEST, '--request', 'constant.builtin')
    assertHas(REQUEST, 'POST', 'symbol')
  })

  it('scopes a method whatever its case', () => {
    assertHas('curl -X post https://example.com', 'post', 'symbol')
    assertHas('curl -X Delete https://example.com', 'Delete', 'symbol')
  })

  it('scopes long and short flags', () => {
    assertHas(REQUEST, '--header', 'constant.builtin')
    assertHas('curl -s -o out.json https://example.com', '-s', 'constant.builtin')
  })

  it('leaves the hyphens inside a header name alone', () => {
    // `Content-Type` sits inside a string; nothing in it is a flag.
    expect(scoped(REQUEST).some(([t, s]) => t === '-Type' && s === 'constant.builtin')).toBe(false)
  })

  it('scopes quoted values as strings', () => {
    assertHas(REQUEST, "'Content-Type: application/json'", 'string')
    assertHas('curl -d "plain" https://example.com', '"plain"', 'string')
  })

  it('scopes a command substitution inside a double-quoted value', () => {
    assertHas('curl -H "Authorization: Bearer $(cat token)" https://example.com', '$(cat token)', 'variable')
  })

  it('treats an escaped quote as content rather than a string boundary', () => {
    const code = 'curl -d "{\\"a\\":1}" https://example.com'
    expect(
      runs(code)
        .map(([text]) => text)
        .join(''),
    ).toBe(code)
  })

  it('does not scope a bare word as a method', () => {
    // `post` only reads as a method after `--request` or `-X`.
    expect(scoped('curl https://example.com/post').some(([, s]) => s === 'symbol')).toBe(false)
  })
})
