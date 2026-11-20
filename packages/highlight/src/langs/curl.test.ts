import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { registerLanguage, tokenize } from '../index'
import curl from './curl'
import json from './json'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order. JSON is what a request body embeds.
registerLanguage(curl)
registerLanguage(json)

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

/**
 * The scope of the first run containing this text, `undefined` when that run is
 * unscoped. Unscoped text merges with the spaces around it, so an exact match
 * would never find a bare flag and every check against it would pass.
 */
const scopeOf = (code: string, text: string): string | undefined => {
  const run = runs(code).find(([t]) => t.includes(text))
  expect(run, `${JSON.stringify(text)} is not in the code`).toBeDefined()
  return run?.[1] ?? undefined
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
    assertHas(REQUEST, 'POST', 'symbol')
    expect(scopeOf(REQUEST, '--request')).toBeUndefined()
  })

  it('scopes a method whatever its case', () => {
    assertHas('curl -X post https://example.com', 'post', 'symbol')
    assertHas('curl -X Delete https://example.com', 'Delete', 'symbol')
  })

  it('leaves long and short flags unscoped', () => {
    // A flag's class would be shared with values that should be coloured, such
    // as `true` in a JSON body.
    expect(scopeOf(REQUEST, '--header')).toBeUndefined()
    expect(scopeOf('curl -s -o out.json https://example.com', '-s')).toBeUndefined()
  })

  it('does not read a digit inside a flag as a number', () => {
    expect(scopeOf('curl --http2 https://example.com', '2')).toBeUndefined()
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

  it('scopes the command whatever its case', () => {
    assertHas('CURL https://example.com', 'CURL', 'keyword')
  })

  it('scopes a line-ending backslash as punctuation', () => {
    assertHas(REQUEST, '\\', 'punctuation')
    assertHas('curl -X POST \\\r\n  https://example.com', '\\', 'punctuation')
  })

  it('treats an escaped single quote as content, so the value after it stays a string', () => {
    const code = "curl -H 'X-Note: it'\\''s' -s https://example.com"
    assertHas(code, "\\'", 'string.escape')
    assertHas(code, "'s'", 'string')
    expect(scopeOf(code, '-s')).toBeUndefined()
  })

  describe('request body', () => {
    it('highlights a single-quoted JSON body as JSON', () => {
      assertHas(`curl -d '{"ok":true,"n":null}'`, 'true', 'boolean')
      assertHas(REQUEST, '"name"', 'property')
      assertHas(REQUEST, '"Mars"', 'string')
      assertHas(REQUEST, '{', 'punctuation.bracket')
    })

    it('highlights nested arrays with JSON literals and numbers', () => {
      const code = `curl -d '[[true,false,null,-1.25e+2,0]]'`
      assertHas(code, 'true', 'boolean')
      assertHas(code, 'false', 'boolean')
      assertHas(code, 'null', 'constant.builtin')
      assertHas(code, '-1.25e+2', 'number')
      assertHas(code, '0', 'number')
    })

    it('highlights a JSON array body after any data flag', () => {
      for (const flag of ['-d', '--data', '--data-raw', '--data-binary', '--json']) {
        assertHas(`curl ${flag} '[{"id":1}]' https://example.com`, '"id"', 'property')
      }
    })

    it.each(['--data', '--data-raw', '--data-binary', '--data-ascii', '--json'])(
      'highlights JSON attached to %s with an equals sign',
      (flag) => {
        const code = `curl ${flag}='{"id":1}' https://example.com`
        assertHas(code, '"id"', 'property')
        expect(scopeOf(code, `${flag}=`)).toBeUndefined()
      },
    )

    it('keeps an equals sign in the short data option value', () => {
      assertHas(`curl -d='{"id":1}'`, `'{"id":1}'`, 'string')
    })

    it('does not pick up a separate argument after an empty attached value', () => {
      assertHas(`curl --json= '{"id":1}'`, `'{"id":1}'`, 'string')
      assertHas(`curl --json=\\\n '{"id":1}'`, `'{"id":1}'`, 'string')
    })

    it.each(['\n', '\r\n'])('highlights an attached JSON body after a line continuation (%j)', (newline) => {
      const code = `curl --json=\\${newline}'{"id":1}' https://example.com`
      assertHas(code, '\\', 'punctuation')
      assertHas(code, '"id"', 'property')
    })

    it('keeps a JSON string whole across an escaped apostrophe', () => {
      const code = `curl -d '{"note":"it'\\''s a gift","n":1}' -H 'Accept: */*' https://example.com`
      assertHas(code, `"it'\\''s a gift"`, 'string')
      assertHas(code, '"n"', 'property')
      assertHas(code, "'Accept: */*'", 'string')
    })

    it(`keeps a JSON string whole across the '"'"' apostrophe idiom`, () => {
      const code = `curl -d '{"note":"it'"'"'s a gift","n":1}' -H 'Accept: */*'`
      assertHas(code, `"it'"'"'s a gift"`, 'string')
      assertHas(code, '"n"', 'property')
      assertHas(code, "'Accept: */*'", 'string')
    })

    it.each([String.raw`'\''`, `'"'"'`])('keeps JSON keys in one scope across %s', (apostrophe) => {
      const key = `"it${apostrophe}s=ok"`
      const code = `curl --json '{${key}:true}' -H 'Accept: */*'`
      assertHas(code, key, 'property')
      assertHas(code, 'true', 'boolean')
      assertHas(code, "'Accept: */*'", 'string')
    })

    it('finds the body on the line after a line continuation', () => {
      assertHas(`curl -d \\\n  '{"a":1}'`, '"a"', 'property')
    })

    it('leaves a body that is not JSON as a string', () => {
      assertHas("curl -d 'name=Mars' https://example.com", "'name=Mars'", 'string')
      assertHas(`curl --form 'meta={"a":1}' https://example.com`, `'meta={"a":1}'`, 'string')
    })

    it.each(['[item]=Mars', '[1]=[2]', '["item"]=[2]', '[item]', '[INFO] ready'])(
      'leaves bracket-leading text %s as a string',
      (body) => {
        const quotedBody = `'${body}'`
        assertHas(`curl -d ${quotedBody} https://example.com`, quotedBody, 'string')
      },
    )

    it('leaves bracketed plain text passed to --data-binary as a string', () => {
      assertHas("curl --data-binary '[INFO]' https://example.com", "'[INFO]'", 'string')
    })

    it.each(['', '\\\n'])('keeps adjacent form argument segments as strings (%j)', (separator) => {
      const code = `curl -d '[1]'${separator}='[2]' https://example.com`
      assertHas(code, "'[1]'", 'string')
      assertHas(code, "'[2]'", 'string')
    })

    it('highlights a complete JSON argument before a shell operator', () => {
      assertHas("curl -d '[true]'&& echo done", 'true', 'boolean')
    })

    it('does not read lowercase -f or uppercase -D as data flags', () => {
      assertHas(`curl -f '{"a":1}' https://example.com`, `'{"a":1}'`, 'string')
      assertHas(`curl -D '{"a":1}' https://example.com`, `'{"a":1}'`, 'string')
    })

    it('round-trips an empty and an unterminated body', () => {
      for (const code of ["curl -d '' https://example.com", `curl -d '{"a":`]) {
        expect(
          runs(code)
            .map(([text]) => text)
            .join(''),
        ).toBe(code)
      }
    })

    it('highlights an unterminated JSON body up to the end of the snippet', () => {
      assertHas(`curl -d '{"a":`, '"a"', 'property')
    })
  })
})
