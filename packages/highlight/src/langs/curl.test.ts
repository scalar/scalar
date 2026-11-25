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

  it.each(['--http2', '--http1.1', '--tlsv1.2', '-4', '-6', '-0', '-4s'])(
    'leaves every character in %s unscoped',
    (flag) => {
      expect(scoped(`curl ${flag} https://example.com`)).toStrictEqual([['curl', 'keyword']])
    },
  )

  it('leaves grouped numeric and punctuation switches before a header option unscoped', () => {
    expect(scoped('curl -4#H "X-Test: 1" https://example.com')).toStrictEqual([
      ['curl', 'keyword'],
      ['"X-Test: 1"', 'string'],
    ])
  })

  it.each(['-sd ', '-sS4d'])('highlights JSON after a grouped -d option (%j)', (options) => {
    assertHas(`curl ${options}'{"id":1}'`, '"id"', 'property')
  })

  it('leaves the next argument as a string when d is the value of an option', () => {
    assertHas(`curl -od '{"id":1}'`, `'{"id":1}'`, 'string')
  })

  it.each(['[1][2]', '[1 2]', '{"id":}'])('leaves a closed malformed JSON body %s as a string', (body) => {
    const code = `curl --data-binary '${body}' -H "Accept: */*"`
    assertHas(code, `'${body}'`, 'string')
    assertHas(code, '"Accept: */*"', 'string')
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

  it.each(['\n', '\r\n'])('scopes a continuation inside a double-quoted header (%j)', (newline) => {
    expect(scoped(`curl -H "X-Example: first\\${newline}second" https://example.com`)).toStrictEqual([
      ['curl', 'keyword'],
      ['"X-Example: first', 'string'],
      ['\\', 'punctuation'],
      [`${newline}second"`, 'string'],
    ])
  })

  it.each(['\\ ', '\\\n', '\\\r\n'])('keeps a data-like suffix in the same header word (%j)', (join) => {
    const value = `'{"id":1}'`
    assertHas(`curl --header X-Debug:${join}-d${value} https://example.com`, value, 'string')
  })

  it('finds a data option after a continued argument separator', () => {
    assertHas("curl \\\n-d '[true]' https://example.com", 'true', 'boolean')
  })

  it('keeps JSON after a bare newline separate from the data option', () => {
    assertHas("curl -d\n'[true]'", "'[true]'", 'string')
  })

  it('highlights JSON when a line continuation joins the long option and equals sign', () => {
    const code = "curl --data\\\n='[true]' https://example.com"
    assertHas(code, '\\', 'punctuation')
    assertHas(code, 'true', 'boolean')
  })

  it('treats an escaped single quote as content, so the value after it stays a string', () => {
    const code = "curl -H 'X-Note: it'\\''s' -s https://example.com"
    assertHas(code, "\\'", 'string.escape')
    assertHas(code, "'s'", 'string')
    expect(scopeOf(code, '-s')).toBeUndefined()
  })

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

  it.each(['--', '-o', '--output', '--expand-header', '-d', '--json', '-X'])(
    'keeps the word after %s -d out of JSON',
    (prefix) => {
      expect(scoped(`curl ${prefix} -d '[true]'`)).toStrictEqual([
        ['curl', 'keyword'],
        ["'[true]'", 'string'],
      ])
    },
  )

  it('resumes option parsing in the next shell command', () => {
    const code = "curl -- -d '[false]'; curl -d '[true]'"
    assertHas(code, "'[false]'", 'string')
    assertHas(code, 'true', 'boolean')
  })

  it('highlights curl payloads in a pipeline without treating another command as curl', () => {
    const code = "curl --json '[true]' | tr -d '[false]'; /usr/bin/curl -d '[null]'"
    assertHas(code, 'true', 'boolean')
    assertHas(code, "'[false]'", 'string')
    assertHas(code, 'null', 'constant.builtin')
  })

  it.each(['', '$ curl ', '"curl" ', 'env MODE=test curl ', 'cu\\\nrl '])(
    'recognizes curl operands in a fragment or invocation starting with %j',
    (command) => {
      assertHas(`${command}-d '[true]'`, 'true', 'boolean')
    },
  )

  it.each(['env -i curl', 'sudo -n curl', 'sudo -u root curl', 'time -p curl', 'if curl', 'curl.exe'])(
    'preserves method and JSON highlighting for %s',
    (command) => {
      const code = `${command} -X POST -d '[true]'`
      assertHas(code, 'POST', 'symbol')
      assertHas(code, 'true', 'boolean')
    },
  )

  it('keeps wrapper option values named curl out of command position', () => {
    assertHas("env -u curl tr -d '[false]'", "'[false]'", 'string')
  })

  it.each(['env -iu', 'env -i\\\nu', 'sudo -nu'])(
    'consumes the operand of a grouped wrapper option after %j',
    (wrapper) => {
      const code = `${wrapper} value curl -X POST -d '[true]'`
      assertHas(code, 'POST', 'symbol')
      assertHas(code, 'true', 'boolean')
      assertHas(`${wrapper} curl tr -d '[false]'`, "'[false]'", 'string')
    },
  )

  it.each(['2>&1', '&>output.log', '$(printf example.test)', '<(echo example.test)', '`echo example.test`'])(
    'keeps options disabled through %s',
    (syntax) => {
      assertHas(`curl -- ${syntax} -d '[true]'`, "'[true]'", 'string')
    },
  )

  it('ignores data-like strings inside an option value provided by command substitution', () => {
    assertHas(`curl -o $(printf '%s' -d '[true]') https://example.test`, "'[true]'", 'string')
  })

  it('keeps a data-like suffix in a word that starts with command substitution', () => {
    assertHas("curl $(printf example.test)-d'[true]'", "'[true]'", 'string')
  })

  it('finds the body after a shell redirection between the data option and its operand', () => {
    assertHas("curl -d 2>/dev/null '[true]'", 'true', 'boolean')
  })

  it.each(['\n', '\r\n'])('preserves curl argument handling across redirection splices (%j)', (newline) => {
    const continuation = '\\' + newline
    const body = `curl --data 2${continuation}>/dev/null '[true]'`
    assertHas(body, '\\', 'punctuation')
    assertHas(body, 'true', 'boolean')
    const positional = `curl -- 2>${continuation}&1 -d '[true]'`
    assertHas(positional, '\\', 'punctuation')
    assertHas(positional, "'[true]'", 'string')
  })

  it.each(['https://example.com', '-o'])('ignores data flags in a shell comment after %s', (value) => {
    assertHas(`curl ${value} # -d '[true]'`, "# -d '[true]'", 'comment')
  })

  it.each([';', '&&', ';\\\n'])('ignores a shell comment directly after %j', (operator) => {
    assertHas(`curl -- example.test${operator}# try -d '[true]'`, "# try -d '[true]'", 'comment')
  })

  it.each(['\n', '\r\n'])('recognizes short and long data options split by a continuation (%j)', (newline) => {
    const continuation = '\\' + newline
    for (const flag of [`-s${continuation}d`, `--da${continuation}ta-binary`, `-${continuation}-json`]) {
      const code = `curl ${flag} '[true]'`
      assertHas(code, '\\', 'punctuation')
      assertHas(code, 'true', 'boolean')
    }
  })

  it.each(['\n', '\r\n'])('leaves spliced numeric and dotted switches plain (%j)', (newline) => {
    const continuation = '\\' + newline
    for (const flag of [`-4${continuation}s`, `--http${continuation}1.1`]) {
      expect(scoped(`curl ${flag} https://example.test`)).toStrictEqual([
        ['curl', 'keyword'],
        ['\\', 'punctuation'],
      ])
    }
  })

  it.each(['\n', '\r\n'])('marks a continuation inside a header command substitution (%j)', (newline) => {
    const code = `curl -H "X-Example: $(echo first\\${newline}second)"`
    assertHas(code, '\\', 'punctuation')
  })

  it('keeps JSON validation when the grammar is cloned', () => {
    const code = "curl -d '[1 2]'"
    const cloned = structuredClone(curl)
    expect(tokenize(code, cloned)).toStrictEqual(tokenize(code, 'curl'))
    assertHas(code, "'[1 2]'", 'string')
  })

  it.each(['\n', '\r\n'])('keeps JSON keys scoped across spliced apostrophe escapes (%j)', (newline) => {
    const continuation = '\\' + newline
    for (const apostrophe of [`'${continuation}\\'${continuation}'`, `'"${continuation}'${continuation}"'`]) {
      const key = `"it${apostrophe}s"`
      const code = `curl --json '{${key}:true}'`
      expect(
        runs(code)
          .filter(([, scope]) => scope === 'property')
          .map(([text]) => text)
          .join(''),
      ).toBe(key.replaceAll(continuation, newline))
      expect(runs(code).filter(([text, scope]) => text === '\\' && scope === 'punctuation')).toStrictEqual([
        ['\\', 'punctuation'],
        ['\\', 'punctuation'],
      ])
      assertHas(code, 'true', 'boolean')
    }
  })
})
