import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import ini from './ini'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order; registering twice is harmless.
// The registry is a module-level singleton, and re-registering is idempotent.
registerLanguage(ini)

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
 * A config file of the kind people actually label `ini`: classic sections and
 * `;` comments sharing a file with TOML tables, and every value form that makes
 * the key/value split hard — bare values holding `:`, `=` and `#`, multi-line
 * strings whose contents look like keys, and each numeric literal TOML has.
 */
const SAMPLE = `; Edge fleet configuration.
; Classic INI headers over a TOML body, which is what most .ini files are.

[owner]
name = "Amrit Kahlon"
org = 'Scalar GmbH'
dob = 1979-05-27T07:32:00-08:00

[server]
host = 127.0.0.1
port = 8080          # bind port, not the health port
enabled = true
debug = no
timeout_ms = 2_500
ratio = 0.42
scale = 1.5e-3
drift = -2E+4
mask = 0xDEAD_BEEF
umask = 0o755
flags = 0b1010_0110
ceiling = inf
floor = -nan

[server.tls]
"cert.path" = "/etc/ssl/edge.pem"
'key.path' = '/etc/ssl/edge.key'
ciphers = [ "TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256" ]
renew.after.days = 30

[paths]
; the classic trap: separators and comment markers inside a bare value
search = /usr/local/bin:/usr/bin:/bin
query = select=1&limit=10
docs = https://example.com/guide#install
password = hunter2#not-a-comment

[banner]
motd = """
  Fleet is UP.
  timeout = 30 is not a key inside a string.
  Escaped: \\tcolumn and a \\\\ backslash.
"""
pattern = '''\\d{3}-\\d{4} stays literal, even \\n and '' inside'''

[limits]
window = 07:32:00.999
review_day = 2026-08-12
retries = [ 1, 2, 3, 5 ]
routing = { primary = "eu-west", fallback = 'us-east', weight = 0.75 }
matrix = [
  [ 1, 2 ],   # a comment inside a multi-line array
  [ 3, 4 ],
]

[[products]]
name = "Hammer"
sku = 738_594_937

[[products]]
name = "Nail"
colour = "grey"
sku = 284_758_393

[logging]
level: debug
format: json
rotate: yes
! a bang opens a comment only at the start of a line
`

describe('ini', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'ini')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'ini')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'ini')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `ini emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = textFromHtml(highlight(SAMPLE, 'ini'))
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A state that never pops shows up here and nowhere else: this is what an
    // editor feeds the highlighter on every keystroke.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'ini')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('tells a table header from an array-of-tables header', () => {
    assertHas('[server]\n', 'ini', '[', 'punctuation.bracket')
    assertHas('[server]\n', 'ini', 'server', 'namespace')
    assertHas('[[products]]\n', 'ini', '[[', 'punctuation.bracket')
    assertHas('[[products]]\n', 'ini', ']]', 'punctuation.bracket')
    assertHas('[[products]]\n', 'ini', 'products', 'namespace')
    // The dotted path is segments and delimiters, not one blob.
    assertHas('[server.tls]\n', 'ini', 'tls', 'namespace')
    assertHas('[server.tls]\n', 'ini', '.', 'punctuation.delimiter')
  })

  it('scopes a key only where a key can start', () => {
    // `key=value` after the separator is part of the value, however much it
    // looks like a second assignment.
    const code = 'command = make key=value\n'
    assertHas(code, 'ini', 'command', 'property')
    expect(scoped(code, 'ini').filter(([, s]) => s === 'property')).toHaveLength(1)
  })

  it('does not read a key out of a multi-line string body', () => {
    const code = 'motd = """\ntimeout = 30\n"""\n'
    // `motd` is the only key here; the one in the body is string content.
    expect(scoped(code, 'ini').filter(([, s]) => s === 'property')).toEqual([['motd', 'property']])
    assertHas(code, 'ini', '"""\ntimeout = 30\n"""', 'string')
  })

  it('takes the first separator on the line and leaves the rest to the value', () => {
    const code = 'search = /usr/local/bin:/usr/bin:/bin\n'
    assertHas(code, 'ini', 'search', 'property')
    assertHas(code, 'ini', '=', 'operator')
    // The `:` here is path punctuation, not a second separator.
    expect(scoped(code, 'ini').some(([t]) => t === ':')).toBeFalsy()
    // `:` is a separator in its own right at the head of a line, though.
    assertHas('level: debug\n', 'ini', 'level', 'property')
    assertHas('level: debug\n', 'ini', ':', 'operator')
  })

  it('opens a comment on a whitespace-preceded marker only', () => {
    assertHas('port = 8080 # bind port\n', 'ini', '# bind port', 'comment')
    assertHas('; a whole line\n', 'ini', '; a whole line', 'comment')
    // Glued to the value, `#` is a value character — passwords and URL
    // fragments are the two places this shows up.
    const glued = 'password = hunter2#not-a-comment\ndocs = https://x.dev/g#install\n'
    expect(scoped(glued, 'ini').some(([, s]) => s === 'comment')).toBeFalsy()
    // And inside a quoted value it is just text.
    assertHas('docs = "https://x.dev/g#install"\n', 'ini', '"https://x.dev/g#install"', 'string')
  })

  it('tells a boolean from a bare word that starts with one', () => {
    assertHas('enabled = yes\n', 'ini', 'yes', 'boolean')
    assertHas('debug = false\n', 'ini', 'false', 'boolean')
    for (const bare of ['answer = nope\n', 'path = /opt/on\n', 'mood = not-true\n']) {
      expect(
        scoped(bare, 'ini').some(([, s]) => s === 'boolean'),
        bare,
      ).toBeFalsy()
    }
    // A key spelled like a boolean is still a key.
    assertHas('true = 1\n', 'ini', 'true', 'property')
  })

  it('scopes dotted and quoted keys apart from their values', () => {
    const code = 'renew.after.days = 30\n"cert.path" = "/etc/ssl/edge.pem"\n\'key.path\' = 30\n'
    assertHas(code, 'ini', 'renew', 'property')
    assertHas(code, 'ini', 'days', 'property')
    assertHas(code, 'ini', '.', 'punctuation.delimiter')
    // A quoted key keeps its quotes, the way JSON keys do, and the dot inside
    // it stays part of the name.
    assertHas(code, 'ini', '"cert.path"', 'property')
    assertHas(code, 'ini', "'key.path'", 'property')
    assertHas(code, 'ini', '"/etc/ssl/edge.pem"', 'string')
  })

  it('handles every numeric literal form without splitting a version', () => {
    for (const literal of ['0xDEAD_BEEF', '0o755', '0b1010_0110', '2_500', '1.5e-3', '-2E+4', 'inf', '-nan']) {
      assertHas(`x = ${literal}\n`, 'ini', literal, 'number')
    }
    // A dotted run is one bare value: neither `1.2` nor `2.3` is a number in it.
    for (const bare of ['version = 1.2.3\n', 'host = 127.0.0.1\n', 'tag = v2\n']) {
      expect(
        scoped(bare, 'ini').some(([, s]) => s === 'number'),
        bare,
      ).toBeFalsy()
    }
  })

  it('reads dates and times as literals', () => {
    assertHas('dob = 1979-05-27T07:32:00-08:00\n', 'ini', '1979-05-27T07:32:00-08:00', 'number')
    assertHas('day = 2026-08-12\n', 'ini', '2026-08-12', 'number')
    assertHas('window = 07:32:00.999\n', 'ini', '07:32:00.999', 'number')
  })

  it('escapes a basic string but leaves a literal one alone', () => {
    assertHas('msg = "a\\tb\\u00e9"\n', 'ini', '\\t', 'string.escape')
    assertHas("msg = '''a\\tb'''\n", 'ini', "'''a\\tb'''", 'string')
    // An apostrophe in a bare value must not open a literal string.
    expect(scoped("note = don't stop\n", 'ini').some(([, s]) => s === 'string')).toBeFalsy()
  })

  /**
   * Wall clock, not a growth ratio: both rules below are flat enough per
   * character that the ratio check in `test/languages.test.ts` cannot see them,
   * and both are seconds when the rule is unbounded against milliseconds when
   * it is not. The bound is loose enough that only a real regression trips it.
   */
  const budget = (code: string, what: string): void => {
    tokenize(code, 'ini') // compile the grammar outside the measurement
    const start = performance.now()
    const tokens = tokenize(code, 'ini')
    const elapsed = performance.now() - start
    // Round-trip is a tokenizer invariant, so it cannot fail on its own — it is
    // here so the timing is known to have measured a real tokenization.
    expect(tokens.map((t) => t.text).join(''), `${what} did not round-trip`).toBe(code)
    expect(
      elapsed,
      `${what} (${Math.round(code.length / 1024)}k) took ${elapsed.toFixed(0)}ms — a rule is rescanning`,
    ).toBeLessThan(300)
  }

  it('does not rescan a run of leading whitespace looking for a separator', () => {
    // The key lookahead used to wrap `[ \t]*` around a run that could also match
    // a space, so every leading blank had two readings and the greedy prefix
    // replayed the run from each of them. One line of 8000 spaces cost 14.5 s
    // and the indented payload below 5.6 s. Highlighted source is untrusted, so
    // that is a denial of service on anything rendering a fenced `ini` block.
    budget(`${' '.repeat(8000)}\n`, 'one line of 8000 spaces')
    budget(`${' '.repeat(400)}text here\n`.repeat(200), 'indented text with no separator')
    // A tab never triggered the bug — it was not in the ambiguous class — which
    // is part of why nothing caught this. Both indents still find their key.
    assertHas('\t\thost = 1\n', 'ini', 'host', 'property')
    assertHas('    host = 1\n', 'ini', 'host', 'property')
  })

  it('keeps the value-boundary guard off the front of a rule', () => {
    // A rule beginning with a lookbehind costs the merged alternation its
    // first-character scan for the whole state, which measured 3x on plain
    // `key = value` lines and 4x on whitespace-heavy values under
    // JavaScriptCore — Safari's engine, and the one this repo watches because
    // it punishes big merged alternations hardest.
    for (const [name, state] of Object.entries(ini.states)) {
      for (const rule of state.rules) {
        if ('include' in rule) continue
        const src = typeof rule.match === 'string' ? rule.match : rule.match.source
        expect(src.startsWith('(?<'), `ini:${name} rule starts with a lookbehind: ${src}`).toBeFalsy()
      }
    }
    // The boundary that guard bought is now a trailing lookahead plus a rule
    // that eats a whole bare token, and it still has to hold.
    for (const bare of ['version = 1.2.3\n', 'path = /opt/on\n', "note = don't stop\n", 'tag = v2\n']) {
      expect(
        scoped(bare, 'ini').some(([, s]) => s === 'number' || s === 'boolean' || s === 'string'),
        bare,
      ).toBeFalsy()
    }
  })

  it('does not let a trailing backslash continue a single-quoted string', () => {
    // The backslash that joins two lines is a `"""` feature. Wiring it into the
    // single-line state defeated that state's `$` guard, and the whole next
    // line came back as string content.
    const code = 'a = "x\\\nb = 1\nc = 2\n'
    assertHas(code, 'ini', 'b', 'property')
    assertHas(code, 'ini', '1', 'number')
    assertHas(code, 'ini', 'c', 'property')
    expect(scoped(code, 'ini').some(([t, s]) => s === 'string' && t.includes('\n'))).toBeFalsy()
    // Inside `"""` the continuation is real, and still an escape.
    assertHas('a = """x\\\ny"""\n', 'ini', '\\\n', 'string.escape')
  })

  it('anchors an inline-table key to the delimiter in front of it', () => {
    // An inline table pops only on `}`, so an unclosed one leaves the rest of
    // the document in that state — where the key rule used to be retried at
    // every column of every word, backtracking up to 64 characters each time.
    const word = `${'w'.repeat(128)} `
    budget(`x = { ${word.repeat(Math.ceil((512 * 1024) / word.length))}\n`, 'an unclosed inline table')
    // Every key spelling is still found, after the brace and after a comma.
    const table = 'x = { a.b = 1, "c" = 2, \'d\' = 3, -e = 4 }\n'
    for (const key of ['a.b', '"c"', "'d'", '-e']) assertHas(table, 'ini', key, 'property')
    assertHas('x = {a=1,b=2}\n', 'ini', 'b', 'property')
    // A nested table gets the same treatment.
    assertHas('x = { a = { b = 1 } }\n', 'ini', 'b', 'property')
  })

  it('ends an unclosed inline table with its line', () => {
    // What an editor holds the moment the brace is typed. The state pops on `}`
    // and nothing else, so one half-typed table used to take the `property`
    // scope off every key in the rest of the document.
    const code = 'a = {\nb = 2\n\n[s]\nc = 3\n'
    assertHas(code, 'ini', 'b', 'property')
    assertHas(code, 'ini', 's', 'namespace')
    assertHas(code, 'ini', 'c', 'property')
  })

  it('carries an inline table across a line break a comma left open', () => {
    // TOML writes a long inline table over several lines, and the comma is what
    // holds it open — so the gap after one takes line breaks, and taking them
    // is also what gets the table past the line-end escape above.
    const code = 'a = { x = 1,\n      y = 2 }\n'
    assertHas(code, 'ini', 'x', 'property')
    assertHas(code, 'ini', 'y', 'property')
    assertHas(code, 'ini', '2', 'number')
    assertHas(code, 'ini', '}', 'punctuation.bracket')
  })

  it('scopes the innards of arrays and inline tables', () => {
    const table = 'routing = { primary = "eu-west", weight = 0.75 }\n'
    assertHas(table, 'ini', '{', 'punctuation.bracket')
    assertHas(table, 'ini', 'primary', 'property')
    assertHas(table, 'ini', '0.75', 'number')
    const array = 'matrix = [\n  [ 1, 2 ], # note\n]\n'
    assertHas(array, 'ini', ',', 'punctuation.delimiter')
    assertHas(array, 'ini', '2', 'number')
    // A comment between elements does not end the array.
    assertHas(array, 'ini', '# note', 'comment')
    assertHas(array, 'ini', ']', 'punctuation.bracket')
  })
})
