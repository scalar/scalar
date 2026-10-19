import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { samples } from '../../test/samples'
import { languages as bundled, highlight, isRegistered, tokenize } from '../all'
import { SCOPES } from '../core/scopes'

const known = new Set(Object.keys(SCOPES))

/**
 * Tokens as the renderer sees them: adjacent ranges sharing a scope are one
 * run, so a quoted string is `"abc"` rather than three separate pieces.
 */
const runs = (code: string, lang: string): [string, string | null][] => {
  const out: [string, string | null][] = []
  for (const token of tokenize(code, lang)) {
    const last = out[out.length - 1]
    if (last && last[1] === token.scope) {
      last[0] += token.text
    } else {
      out.push([token.text, token.scope])
    }
  }
  return out
}

/** Scope of the first run whose text is exactly `text`. */
const scopeOf = (code: string, lang: string, text: string): string | null | undefined => {
  return runs(code, lang).find((r) => r[0] === text)?.[1]
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

describe('every bundled language', () => {
  it('registers each bundled grammar', () => {
    // Asserted against what `src/all.ts` exports, not against `listLanguages()`.
    // The registry is a module-level singleton shared by every test file in the
    // run, so a grammar registered by another file — `core.test.ts` registers
    // several — lands in `listLanguages()` too, and whether it does depends on
    // the order Vitest happens to schedule the files in.
    for (const grammar of bundled) {
      expect(isRegistered(grammar.name), `${grammar.name} is exported but not registered`).toBeTruthy()
    }
    expect(bundled.map((g) => g.name).sort()).toEqual([
      'bash',
      'c',
      'clojure',
      'cpp',
      'csharp',
      'css',
      'dart',
      'diff',
      'dockerfile',
      'elixir',
      'fsharp',
      'go',
      'graphql',
      'haskell',
      'html',
      'http',
      'ini',
      'java',
      'javascript',
      'json',
      'julia',
      'kotlin',
      'lua',
      'makefile',
      'markdown',
      'matlab',
      'mojo',
      'nginx',
      'objectivec',
      'ocaml',
      'perl',
      'php',
      'powershell',
      'python',
      'r',
      'ruby',
      'rust',
      'scala',
      'sql',
      'swift',
      'yaml',
    ])
  })

  it('resolves every declared alias through the lazy loader', async () => {
    // `src/lazy.ts` repeats the alias table so `loadLanguage('tsx')` can pick a
    // chunk without importing every grammar to ask each one. Two tables
    // mean two chances to drift, and the drift is invisible until a consumer
    // asks for the alias that was missed.
    const { resolveLanguageName } = await import('../lazy')

    const unresolved: string[] = []
    const misdirected: string[] = []
    for (const grammar of bundled) {
      for (const alias of [grammar.name, ...(grammar.aliases ?? [])]) {
        const target = resolveLanguageName(alias)
        if (!target) {
          unresolved.push(alias)
        } else if (target !== grammar.name) {
          misdirected.push(`${alias} -> ${target}, want ${grammar.name}`)
        }
      }
    }
    expect(unresolved, 'aliases a grammar declares that src/lazy.ts cannot resolve').toEqual([])
    expect(misdirected, 'aliases src/lazy.ts points at the wrong grammar').toEqual([])
  })

  it('rejects a language named after an Object member rather than throwing', async () => {
    // `loadLanguage` promises a rejected promise for an unknown name. A bare
    // `in` check would let `constructor` through and then throw synchronously,
    // escaping the caller's `.catch()`.
    const { loadLanguage, resolveLanguageName } = await import('../lazy')

    for (const name of ['constructor', '__proto__', 'toString', 'valueOf']) {
      expect(resolveLanguageName(name), name).toBeUndefined()
      await expect(loadLanguage(name), name).rejects.toThrow(/Unknown language/)
    }
  })

  it('resolves every name the compat layer highlights through the lazy loader too', async () => {
    // A third table, and so a third chance to drift. A name the compat layer
    // can highlight but `src/lazy.ts` cannot resolve is a chunk no consumer
    // can load: `syntaxHighlight({ lang: 'py3' })` highlighting while
    // `loadLanguage('py3')` rejects is exactly how this drifted before.
    const { resolveLanguageName } = await import('../lazy')
    const { lowlightLanguageMappings, standardLanguages } = await import('../compat/languages')
    const byName = standardLanguages as Record<string, string | null>

    const disagreeing: string[] = []
    const check = (name: string, want: string | null): void => {
      if (!want) {
        return
      }
      const got = resolveLanguageName(name)
      if (got !== want) {
        disagreeing.push(`${name} -> ${got ?? 'nothing'}, want ${want}`)
      }
    }

    for (const [name, grammar] of Object.entries(byName)) {
      check(name, grammar)
    }
    // The lowlight aliases resolve in two hops: to a canonical name first,
    // and to that name's grammar second.
    for (const [alias, canonical] of Object.entries(lowlightLanguageMappings)) {
      check(alias, byName[canonical] ?? null)
    }

    expect(disagreeing, 'names the compat layer highlights that src/lazy.ts resolves differently').toEqual([])
  })

  for (const [lang, code] of Object.entries(samples)) {
    describe(lang, () => {
      it('emits tokens that cover the source exactly', () => {
        expect(
          tokenize(code, lang)
            .map((t) => t.text)
            .join(''),
        ).toBe(code)
      })

      it('emits ranges that agree with their text', () => {
        for (const token of tokenize(code, lang)) {
          expect(code.slice(token.start, token.end)).toBe(token.text)
        }
      })

      it('only uses scopes from the shared vocabulary', () => {
        for (const token of tokenize(code, lang)) {
          if (token.scope !== null) {
            expect(known.has(token.scope), `${lang} emitted unregistered scope "${token.scope}"`).toBeTruthy()
          }
        }
      })

      it('round-trips through the HTML renderer', () => {
        const text = textFromHtml(highlight(code, lang))
        expect(text).toBe(code)
      })

      it('terminates and stays consistent on every truncation', () => {
        // Unterminated strings, half-open tags and dangling states are what
        // real editors feed a highlighter on every keystroke.
        const step = Math.max(1, Math.floor(code.length / 60))
        for (let end = 0; end <= code.length; end += step) {
          const prefix = code.slice(0, end)
          expect(
            tokenize(prefix, lang)
              .map((t) => t.text)
              .join(''),
          ).toBe(prefix)
        }
      })
    })
  }
})

/**
 * Cost has to stay roughly linear in the length of a line.
 *
 * Highlighted source is untrusted — in a docs pipeline it is a fenced block
 * from someone else's document — so a rule that scans to the end of the line
 * and then fails, retried at every column, is a denial of service rather than a
 * slow render. Each seed below was quadratic at some point; the check is on the
 * growth ratio rather than absolute time, so it does not turn into a flaky
 * benchmark on a loaded machine.
 */
describe.skip('cost stays linear in line length', () => {
  /** One seed per rule that was quadratic once, plus untouched controls. */
  const seeds: [string, string][] = [
    ['markdown', '['], // link label
    ['yaml', 'a'], // bare key
    ['yaml', '['], // bare key, from a flow opener
    ['javascript', '$a'], // identifier before a lookahead
    ['rust', 'a'], // macro name — a bare word, which never satisfies the `!`
    ['rust', '#['], // attribute
    ['css', '['], // attribute selector
    ['sql', '['], // bracketed identifier
    ['json', '['], // control
    ['python', 'a'], // control

    // Rules that were quadratic before review. Only the ones whose growth is
    // visible at these lengths live here; the rest are in `budgets` below.
    ['php', '<!-- x'], // unterminated markup comment, once a state
    ['ocaml', 'val a:'], // signature lookahead, now a capped scan
    ['ruby', ',/['], // regex literal, now a capped character class
    ['ruby', '(/['], // same rule, reached from a bracket opener
    ['perl', '$'], // sigil deref before a name, now a capped run of `$`
  ]

  const SMALL = 4000
  const BIG = 16000

  /** Nanoseconds per character, best of two runs to shed scheduler noise. */
  const nsPerChar = (lang: string, code: string): number => {
    let best = Number.POSITIVE_INFINITY
    for (let run = 0; run < 2; run++) {
      const start = performance.now()
      tokenize(code, lang)
      best = Math.min(best, performance.now() - start)
    }
    return (best * 1e6) / code.length
  }

  for (const [lang, seed] of seeds) {
    it(`${lang}: a line of ${JSON.stringify(seed)}`, () => {
      const small = seed.repeat(Math.ceil(SMALL / seed.length))
      const big = seed.repeat(Math.ceil(BIG / seed.length))
      tokenize(small, lang) // compile the grammar outside the measurement

      // Per-character cost, not total: it is flat for a linear scan whatever
      // the machine, and grows with the length multiplier (4x here) for a
      // quadratic one. That makes the threshold a property of the grammar
      // rather than of the hardware.
      //
      // Best of several ratios rather than one. Some of these seeds cost a
      // microsecond per character by design, so the big run takes tens of
      // milliseconds and a single preemption on a shared CI runner is enough
      // to inflate one reading past the threshold. Noise can only ever push a
      // ratio up — a rule that really rescans the line cannot produce a low
      // one — so taking the minimum sheds the false alarms without softening
      // what the check catches.
      let ratio = Number.POSITIVE_INFINITY
      for (let attempt = 0; attempt < 3; attempt++) {
        ratio = Math.min(ratio, nsPerChar(lang, big) / nsPerChar(lang, small))
      }
      expect(
        ratio,
        `${lang} ${JSON.stringify(seed)}: per-character cost grew ${ratio.toFixed(1)}x between ` +
          `${SMALL} and ${BIG} characters, which means a rule is rescanning the line`,
      ).toBeLessThan(3)
    })
  }

  /**
   * Per-character cost budgets, for the rules the ratio check above cannot
   * see.
   *
   * Three reasons a rule lands here instead of in `seeds`:
   *
   * - the growth is only visible past 16 KB. `php`'s unterminated block
   *   comment measures 4.2 s at 128 KB but a ratio of 1.6 at 4 KB -> 16 KB,
   *   comfortably under the threshold, so a seed for it guards nothing.
   * - the payload is not a repeated seed. A printf flag run is one `%`
   *   followed by many flags; the seed harness would build `%0%0%0`, and each
   *   of those fails immediately.
   * - the rule is not reachable from `root`. `http`'s body-exit lookahead only
   *   runs after a blank line, and `php`'s comment rules only after `<?php`.
   *
   * The bound is deliberately loose. Every one of these is sub-millisecond
   * when the rule is bounded and seconds when it is not, so a 1 s ceiling
   * separates them by three orders of magnitude and cannot flake under load.
   */
  const budgets: [string, string, string][] = [
    ['java', '/*a'.repeat(42_000), 'an unterminated block comment'],
    ['c', '/*a'.repeat(42_000), 'an unterminated block comment'],
    ['csharp', '/*a'.repeat(42_000), 'an unterminated block comment'],
    ['php', `<?php ${'/* '.repeat(43_000)}`, 'an unterminated block comment'],
    ['http', `POST /x HTTP/1.1\n\n${'# a\n'.repeat(16_000)}`, 'a body that is entirely comment lines'],
    ['objectivec', `x = "%${'0'.repeat(50_000)}";`, 'one format specifier with a long flag run'],
    ['java', `x = "%${'0'.repeat(50_000)}";`, 'one format specifier with a long flag run'],
    ['powershell', `[${'a'.repeat(50_000)}`, 'a type literal that never closes'],
    ['css', `{${'a'.repeat(50_000)}`, 'a declaration bareword with no colon'],
  ]

  for (const [lang, code, what] of budgets) {
    it(`${lang}: ${what}`, () => {
      tokenize(code, lang) // compile the grammar outside the measurement

      const start = performance.now()
      const tokens = tokenize(code, lang)
      const elapsed = performance.now() - start

      // Round-trip is a tokenizer invariant rather than a grammar property, so
      // this cannot fail on its own — it is here so the timing below is known
      // to have measured a real tokenization of the whole input.
      expect(tokens.map((t) => t.text).join(''), `${lang}: ${what} did not round-trip`).toBe(code)
      expect(
        elapsed,
        `${lang}: ${what} (${Math.round(code.length / 1024)}k) took ${elapsed.toFixed(0)}ms — a rule is rescanning`,
      ).toBeLessThan(1000)
    })
  }

  /**
   * The same guard for the thirteen grammars added in this change, expressed
   * as a multiple of what the grammar costs per character on its own sample
   * rather than as a wall clock.
   *
   * Two reasons it is a ratio here. A flat-but-30x rule — `haskell`'s
   * unguarded qualified-name rule was one — sails under any ceiling loose
   * enough not to flake. And the absolute numbers are not comparable across
   * engines: JavaScriptCore's healthy cost for `haskell` exceeds V8's cost
   * for the broken version, so one wall clock cannot hold on both. A ratio
   * cancels the engine out. The entries above keep their wall clock because
   * those languages have no sample in the shared corpus to divide by.
   *
   * Each bound is set from the cost measured once the rule was fixed, with
   * roughly 2-3x of headroom — not a single multiple, because the fixed costs
   * differ by four orders of magnitude. `perl`'s payload is a string-literal
   * interior its grammar barely touches, so it sits near zero against a
   * sample that is the slowest in the corpus; a shared bound there would
   * notice nothing. Reintroducing each original defect measures, against
   * these bounds, at the payload sizes below: perl 43, ini 12, matlab 719,
   * mojo-params 321, mojo-colons 134, nginx 21, haskell 8.6, lua 304.
   *
   * `nginx`'s brace-dense line is deliberately absent. A ratio cannot see it:
   * the unfixed grammar was slower on its own sample too, so both sides of
   * the fraction moved and a broken run measures 1.7x. It is guarded in
   * `test/langs-nginx.test.ts` instead, against a semicolon-dense line of the
   * same statement density, which isolates the block lookahead from
   * everything else the grammar does.
   */
  const ratioBudgets: [string, string, string, number][] = [
    ['perl', `"%${'0'.repeat(20_000)}"`, 'one format specifier with a long flag run', 0.5],
    ['ini', `${' '.repeat(400)}text here\n`.repeat(60), 'indented lines that never reach a separator', 0.5],
    ['matlab', `properties ${' '.repeat(40_000)}x`, 'a block keyword and a long run of trailing spaces', 3],
    ['mojo', `fn f(${'a'.repeat(16_000)}`, 'an unterminated parameter list holding one long name', 3],
    ['mojo', `var s = f"{${':'.repeat(64_000)}`, 'an unterminated interpolation holding a run of colons', 15],
    ['nginx', 'a'.repeat(200_000), 'one bare word the length of a small file', 0.3],
    ['haskell', 'A'.repeat(40_000), 'one unbroken run of capitals', 3],
    ['lua', `function ${'a'.repeat(50_000)}.`, 'a definition name that never resolves', 1.5],
  ]

  /**
   * Per-character cost of a payload relative to a baseline, timed alternately.
   *
   * Measuring the two in separate loops makes the ratio only as stable as the
   * quieter of them: a scheduler stall landing inside the payload's runs reads
   * as a regression. Alternating puts any stall in both samples, and best-of
   * keeps whichever runs were undisturbed.
   */
  const costRatio = (lang: string, code: string, baseline: string): number => {
    let bestCode = Number.POSITIVE_INFINITY
    let bestBaseline = Number.POSITIVE_INFINITY
    for (let run = 0; run < 5; run++) {
      let start = performance.now()
      tokenize(code, lang)
      bestCode = Math.min(bestCode, (performance.now() - start) / code.length)

      start = performance.now()
      tokenize(baseline, lang)
      bestBaseline = Math.min(bestBaseline, (performance.now() - start) / baseline.length)
    }
    return bestCode / bestBaseline
  }

  for (const [lang, code, what, limit] of ratioBudgets) {
    it(`${lang}: ${what}`, () => {
      const baseline = samples[lang]
      if (!baseline) {
        throw new Error(`${lang} has no sample in test/samples.ts to measure against`)
      }

      tokenize(code, lang) // compile the grammar outside the measurement
      tokenize(baseline, lang)

      // Round-trip is a tokenizer invariant rather than a grammar property, so
      // this cannot fail on its own — it is here so the timing below is known
      // to have measured a real tokenization of the whole input.
      expect(
        tokenize(code, lang)
          .map((t) => t.text)
          .join(''),
        `${lang}: ${what} did not round-trip`,
      ).toBe(code)

      const ratio = costRatio(lang, code, baseline)
      expect(
        ratio,
        `${lang}: ${what} (${Math.round(code.length / 1024)}k) cost ${ratio.toFixed(1)}x what this grammar ` +
          'costs per character on its own sample — a rule is rescanning',
      ).toBeLessThan(limit)
    })
  }
})

describe('python', () => {
  const py = (code: string) => code

  it('separates control flow from declaration keywords', () => {
    assertHas(py('def f():\n    return 1\n'), 'python', 'def', 'keyword.declaration')
    assertHas(py('def f():\n    return 1\n'), 'python', 'return', 'keyword.control')
  })

  it('scopes a function name at its definition', () => {
    assertHas(py('def compute(x):\n    pass\n'), 'python', 'compute', 'function')
  })

  it('treats a leading triple-quoted string as documentation', () => {
    expect(scopeOf('"""Module docs."""\n', 'python', '"""Module docs."""')).toBe('comment.doc')
  })

  it('treats an assigned triple-quoted string as a string', () => {
    expect(scopeOf('SQL = """select 1"""\n', 'python', '"""select 1"""')).toBe('string')
  })

  it('highlights f-string interpolations as expressions', () => {
    const code = 'print(f"{user.name!r} owes {total:>8.2f}")\n'
    assertHas(code, 'python', '{', 'interpolation')
    assertHas(code, 'python', 'name', 'variable.member')
    assertHas(code, 'python', '!r', 'string.special')
    assertHas(code, 'python', ':>8.2f', 'string.special')
  })

  it('leaves doubled braces in an f-string as literal text', () => {
    assertHas('f"{{literal}}"\n', 'python', '{{', 'string.escape')
  })

  it('scopes a string prefix separately from the literal', () => {
    assertHas('rb"\\d+"\n', 'python', 'rb', 'string.special')
  })

  it('distinguishes self from ordinary names', () => {
    assertHas('self.value = 1\n', 'python', 'self', 'variable.builtin')
  })

  it('keeps self a builtin inside a signature', () => {
    assertHas('def m(self, x):\n    pass\n', 'python', 'self', 'variable.builtin')
    assertHas('def m(self, x):\n    pass\n', 'python', 'x', 'variable.parameter')
  })

  it('tells an annotation apart from the parameter it annotates', () => {
    const code = 'def f(count: int = 0, items: list[str] = []):\n    pass\n'
    assertHas(code, 'python', 'count', 'variable.parameter')
    assertHas(code, 'python', 'int', 'type.builtin')
    assertHas(code, 'python', 'items', 'variable.parameter')
    assertHas(code, 'python', 'list', 'type.builtin')
  })

  it('does not mistake a default value for a parameter name', () => {
    const pairs = scoped('def f(mode=DEFAULT_MODE):\n    pass\n', 'python')
    expect(pairs.some(([t, s]) => t === 'mode' && s === 'variable.parameter')).toBeTruthy()
    expect(pairs.some(([t, s]) => t === 'DEFAULT_MODE' && s === 'constant')).toBeTruthy()
  })

  it('keeps a starred parameter and its sigil scoped separately', () => {
    const code = 'def f(*args, **kwargs):\n    pass\n'
    assertHas(code, 'python', '*', 'operator')
    assertHas(code, 'python', 'args', 'variable.parameter')
    assertHas(code, 'python', '**', 'operator')
    assertHas(code, 'python', 'kwargs', 'variable.parameter')
  })

  it('scopes a parameter whose name starts outside ASCII', () => {
    // `ID` allows non-ASCII names, so the rule cannot be anchored with `\b`:
    // there is no word boundary in front of `π`.
    assertHas('def f(π, café):\n    pass\n', 'python', 'π', 'variable.parameter')
    assertHas('def f(π, café):\n    pass\n', 'python', 'café', 'variable.parameter')
    assertHas('lambda π: π\n', 'python', 'π', 'variable.parameter')
  })

  it('stays linear on a long parameter name in an unclosed signature', () => {
    // The name rule was unanchored, so it restarted the scan at every column:
    // 7.5 s at 20k characters. An unterminated `def f(` is what an editor sees
    // mid-keystroke, and in a docs pipeline it is untrusted text.
    const code = `def f(${'a'.repeat(64_000)}`
    tokenize(code, 'python') // compile the grammar outside the measurement

    const start = performance.now()
    const tokens = tokenize(code, 'python')
    const elapsed = performance.now() - start

    expect(tokens.map((t) => t.text).join('')).toBe(code)
    expect(
      elapsed,
      `a ${64_000}-character parameter name took ${elapsed.toFixed(0)}ms — the name rule is rescanning`,
    ).toBeLessThan(1000)
  })

  it('stays linear on a run of colons inside an unclosed f-string interpolation', () => {
    // The format-spec scan ran to the end of the line and then failed, once per
    // colon: 18.6 s at 45k characters before the cap.
    const code = `f"{${':'.repeat(32_000)}`
    tokenize(code, 'python') // compile the grammar outside the measurement

    const start = performance.now()
    const tokens = tokenize(code, 'python')
    const elapsed = performance.now() - start

    expect(tokens.map((t) => t.text).join('')).toBe(code)
    expect(
      elapsed,
      `${32_000} colons in an unclosed interpolation took ${elapsed.toFixed(0)}ms — the spec scan is rescanning`,
    ).toBeLessThan(1000)
  })

  it('does not let a comma inside a subscript end a parameter', () => {
    const code = 'def f(x: Dict[str, int], y: int = 2):\n    pass\n'
    assertHas(code, 'python', 'y', 'variable.parameter')
  })

  it('reads a builtin call as a builtin, and an attribute of the same name as a method', () => {
    assertHas('print(1)\n', 'python', 'print', 'function.builtin')
    assertHas('logger.print(1)\n', 'python', 'print', 'function.method')
    assertHas('logger.print\n', 'python', 'print', 'variable.member')
  })

  it('separates SCREAMING_CASE constants from CapWords types', () => {
    assertHas('MAX = Timeout()\n', 'python', 'MAX', 'constant')
    assertHas('MAX = Timeout()\n', 'python', 'Timeout', 'type')
  })

  it('scopes decorators including their dotted path', () => {
    assertHas('@app.route("/")\ndef index():\n    pass\n', 'python', '@app.route', 'decorator')
  })

  it('scopes dunder names distinctly', () => {
    assertHas('def __init__(self):\n    pass\n', 'python', '__init__', 'function')
    assertHas('if __name__ == "__main__":\n    pass\n', 'python', '__name__', 'variable.special')
  })

  it('reads a keyword argument as a parameter but an assignment as a statement', () => {
    assertHas('f(timeout=30)\n', 'python', 'timeout', 'variable.parameter')
    const assignment = scoped('timeout = 30\n', 'python')
    expect(assignment.some(([t, s]) => t === 'timeout' && s === 'variable.parameter')).toBeFalsy()
  })

  it('does not let an unterminated string swallow the rest of the file', () => {
    const pairs = scoped('x = "oops\ny = 1\n', 'python')
    expect(pairs.some(([t, s]) => t === '1' && s === 'number')).toBeTruthy()
  })

  it('recognises match and case only as statements', () => {
    assertHas('match command:\n    case "go":\n        pass\n', 'python', 'match', 'keyword.control')
    const call = scoped('result = match(pattern)\n', 'python')
    expect(call.some(([t, s]) => t === 'match' && s === 'keyword.control')).toBeFalsy()
  })

  it('handles numeric literal forms', () => {
    for (const literal of ['0xFF', '0o755', '0b1010', '1_000_000', '3.14e-2', '2j']) {
      expect(scopeOf(`x = ${literal}\n`, 'python', literal), literal).toBe('number')
    }
  })
})

describe('javascript', () => {
  it('tells a regex literal from division', () => {
    assertHas('const re = /ab+/g;\n', 'javascript', '/ab+/g', 'regexp')
    const division = scoped('const half = total / 2;\n', 'javascript')
    expect(division.some(([, s]) => s === 'regexp')).toBeFalsy()
  })

  it('highlights template interpolations', () => {
    const code = 'const s = `a ${b.c} d`;\n'
    assertHas(code, 'javascript', '${', 'interpolation')
    assertHas(code, 'javascript', 'c', 'variable.member')
  })

  it('keeps an object literal inside an interpolation from ending it', () => {
    const code = 'const s = `${fn({ a: 1 })} tail`;\n'
    const text = tokenize(code, 'javascript')
      .map((t) => t.text)
      .join('')
    expect(text).toBe(code)
    assertHas(code, 'javascript', ' tail`', 'string')
  })

  it('scopes JSX tags and attributes', () => {
    const code = 'const el = <Button onClick={run} disabled>ok</Button>;\n'
    assertHas(code, 'javascript', 'Button', 'tag')
    assertHas(code, 'javascript', 'onClick', 'tag.attribute')
  })

  it('does not read a comparison as a JSX tag', () => {
    const pairs = scoped('if (a < b && c > d) {}\n', 'javascript')
    expect(pairs.some(([, s]) => s === 'tag')).toBeFalsy()
  })

  it('separates TypeScript type keywords from control flow', () => {
    assertHas('type X = string;\n', 'javascript', 'type', 'keyword.declaration')
    assertHas('type X = string;\n', 'javascript', 'string', 'type.builtin')
  })

  it('scopes JSDoc separately from ordinary comments', () => {
    expect(scopeOf('/** doc */\n', 'javascript', '/** doc */')).toBe('comment.doc')
    expect(scopeOf('/* plain */\n', 'javascript', '/* plain */')).toBe('comment')
  })
})

describe('other languages', () => {
  it('json: separates keys from string values', () => {
    assertHas('{"a": "b"}', 'json', '"a"', 'property')
    assertHas('{"a": "b"}', 'json', '"b"', 'string')
  })

  it('json: flags text that is not valid JSON', () => {
    assertHas('{"a": oops}', 'json', 'oops', 'invalid')
  })

  it('css: separates a property from its value and unit', () => {
    assertHas('.a { margin: 12px; }', 'css', 'margin', 'property')
    assertHas('.a { margin: 12px; }', 'css', '12', 'number')
    assertHas('.a { margin: 12px; }', 'css', 'px', 'unit')
    assertHas('.a { margin: 12px; }', 'css', '.a', 'selector')
  })

  it('html: separates tag names, attributes and values', () => {
    assertHas('<a href="/x">t</a>', 'html', 'a', 'tag')
    assertHas('<a href="/x">t</a>', 'html', 'href', 'tag.attribute')
    assertHas('<a href="/x">t</a>', 'html', '"/x"', 'string')
  })

  it('bash: expands variables in double quotes but not in single quotes', () => {
    assertHas('echo "hi $USER"\n', 'bash', '$USER', 'variable')
    assertHas("echo 'hi $USER'\n", 'bash', "'hi $USER'", 'string')
  })

  it('bash: scopes flags apart from the command', () => {
    assertHas('rm -rf --force /tmp\n', 'bash', '-rf', 'constant')
  })

  it('yaml: scopes keys apart from values', () => {
    assertHas('name: ci\n', 'yaml', 'name', 'property')
    assertHas('debug: true\n', 'yaml', 'true', 'boolean')
  })

  it('markdown: scopes headings, code spans and links', () => {
    assertHas('# Title\n', 'markdown', '# Title', 'heading')
    assertHas('use `npm ci` here\n', 'markdown', '`npm ci`', 'string')
    assertHas('[docs](https://x.dev)\n', 'markdown', 'docs', 'link')
  })

  it('diff: scopes whole added and removed lines', () => {
    assertHas('+added\n-removed\n', 'diff', '+added', 'diff.plus')
    assertHas('+added\n-removed\n', 'diff', '-removed', 'diff.minus')
  })

  it('sql: matches keywords case-insensitively', () => {
    assertHas('select 1 from t\n', 'sql', 'select', 'keyword.control')
    assertHas('SELECT 1 FROM t\n', 'sql', 'SELECT', 'keyword.control')
  })

  it('sql: does not end a literal on a doubled quote', () => {
    assertHas("select 'it''s fine' as x\n", 'sql', "'it''s fine'", 'string')
  })

  it('rust: tells a lifetime from a char literal', () => {
    assertHas("fn f<'a>(c: char) { let x = 'y'; }\n", 'rust', "'a", 'variable.special')
    assertHas("fn f<'a>(c: char) { let x = 'y'; }\n", 'rust', "'y'", 'string')
  })

  it('go: scopes a raw string literal', () => {
    assertHas('s := `raw "quoted"`\n', 'go', '`raw "quoted"`', 'string')
  })
})

/**
 * Inputs that broke against a TextMate (Shiki) reference and today's
 * highlight.js pipeline, most of them taken from what snippetz generates.
 */
describe('regressions from the TextMate comparison', () => {
  it('php: reads a snippet without `<?php` as code', () => {
    // snippetz emits Guzzle and Laravel samples without the opening tag.
    const code = "$client = new GuzzleHttp\\Client();\n$response = $client->request('GET', 'https://x.io');\n"
    assertHas(code, 'php', '$client', 'variable')
    assertHas(code, 'php', "'GET'", 'string')
  })

  it('php: still reads input that opens with markup as a template', () => {
    assertHas('<p><?= $name ?></p>\n', 'php', 'p', 'tag')
    assertHas('<p><?= $name ?></p>\n', 'php', '$name', 'variable')
  })

  it('php: leaves code for markup at `?>` when the snippet opened as code', () => {
    assertHas('echo 1; ?>\n<b>bold</b>\n', 'php', 'b', 'tag')
  })

  it('php: closes a heredoc only on its own marker', () => {
    const code = '<?php\n$sql = <<<SQL\nSELECT 1\nOTHER\nSQL;\necho $sql;\n'
    assertHas(code, 'php', '\nSELECT 1\nOTHER\n', 'string')
    assertHas(code, 'php', 'echo', 'keyword')
  })

  it("bash: treats `\\'` outside quotes as an escape, so `'\\''` keeps the string", () => {
    const code = `curl -d '{"a":"it'\\''s ok"}' https://x.io\n`
    assertHas(code, 'bash', "\\'", 'string.escape')
    assertHas(code, 'bash', `'s ok"}'`, 'string')
  })

  it('bash: closes a heredoc only on its terminator, and does not expand a quoted one', () => {
    assertHas('cat <<EOF\nEND\n$HOME\nEOF\necho done\n', 'bash', 'echo', 'function.builtin')
    // The body merges with the closing quote of the marker into one run.
    assertHas("cat <<'EOF'\n$HOME\nEOF\n", 'bash', "'\n$HOME\n", 'string')
  })

  it('yaml: keeps prose with a colon inside a block scalar', () => {
    const code = 'description: |\n  Returns users.\n  Note: results are paginated.\nsummary: List\n'
    assertHas(code, 'yaml', '\n  Returns users.\n  Note: results are paginated.\n', 'string')
    assertHas(code, 'yaml', 'summary', 'property')
  })

  it('yaml: ends a list item block scalar at its key column', () => {
    const code = '- run: |\n    echo a: b\n  name: x\n'
    assertHas(code, 'yaml', '\n    echo a: b\n', 'string')
    assertHas(code, 'yaml', 'name', 'property')
  })

  it('yaml: reads a dedented comment after a block scalar as a comment', () => {
    assertHas('info:\n  description: |\n    Hello\n  # a comment\n  title: x\n', 'yaml', '# a comment', 'comment')
  })

  it('yaml: keeps `#` and commas inside a plain scalar', () => {
    assertHas('url: https://x.dev/docs#auth\n', 'yaml', 'https://x.dev/docs#auth', 'string')
    assertHas('description: Hello, world  # greet\n', 'yaml', 'Hello, world', 'string')
    assertHas('description: Hello, world  # greet\n', 'yaml', '# greet', 'comment')
  })

  it('yaml: delimits a flow mapping with commas and brackets', () => {
    const code = 'example: {name: "x", tags: [a, b], n: 3}\n'
    assertHas(code, 'yaml', 'name', 'property')
    assertHas(code, 'yaml', '"x"', 'string')
    assertHas(code, 'yaml', '3', 'number')
  })

  it('csharp: closes a raw string only on the run of quotes that opened it', () => {
    const code = 'var s = """"\nhas """ inside\n"""";\nint n = 1;\n'
    assertHas(code, 'csharp', '""""\nhas """ inside\n""""', 'string')
    assertHas(code, 'csharp', 'int', 'type.builtin')
  })

  it('java: keeps a string open across a lone carriage return or U+2028', () => {
    assertHas('x("a\rb"); y();\n', 'java', '"a\rb"', 'string')
    assertHas('x("a b"); y();\n', 'java', '"a b"', 'string')
  })

  it('css: reads an unquoted url as a string rather than a `//` comment', () => {
    const code = '.a { background: url(https://x.io/a.png); color: red; }\n'
    assertHas(code, 'css', 'https://x.io/a.png', 'string')
    assertHas(code, 'css', 'color', 'property')
  })

  it('html: highlights script and style bodies with their own grammars', () => {
    const code = '<style>.a { color: red; }</style>\n<script>const x = "</div>"; // c\n</script>\n'
    assertHas(code, 'html', 'color', 'property')
    assertHas(code, 'html', 'const', 'keyword.declaration')
    assertHas(code, 'html', '// c', 'comment')
    assertHas(code, 'html', 'script', 'tag')
  })

  it.each(['style-guide', 'script-widget', 'style.guide', 'script:widget'])('html: keeps %s in markup mode', (tag) => {
    const code = `<${tag}><button>Click</button></${tag}>`
    expect(scoped(code, 'html').filter(([, scope]) => scope === 'tag')).toEqual([
      [tag, 'tag'],
      ['button', 'tag'],
      ['button', 'tag'],
      [tag, 'tag'],
    ])
  })

  it('html: does not end embedded bodies at a longer closing tag name', () => {
    const code =
      '<SCRIPT>const x = "</script-widget>"; const y = 42;</SCRIPT>\n<STYLE>.a { content: "</style-guide>"; color: red; }</STYLE>'
    assertHas(code, 'html', '"</script-widget>"', 'string')
    assertHas(code, 'html', '42', 'number')
    assertHas(code, 'html', '"</style-guide>"', 'string')
    assertHas(code, 'html', 'color', 'property')
  })

  it('html: scopes the XML declaration as metadata and unquoted attribute values as strings', () => {
    assertHas('<?xml version="1.0"?>\n<a/>\n', 'xml', '<?xml version="1.0"?>', 'decorator')
    assertHas('<input type=text disabled>\n', 'html', 'text', 'string')
  })

  it('rust: nests block comments and closes raw strings on their own hashes', () => {
    assertHas('/* a /* b */ c */ fn f() {}\n', 'rust', 'fn', 'keyword.declaration')
    assertHas('let s = r##"a "# b"##; let t = 1;\n', 'rust', '"a "# b"##', 'string')
  })

  it('markdown: highlights a fence body with the language it names', () => {
    const code = '# Title\n\n```ts\nconst a = 1 // one\n```\n\ntext after\n'
    assertHas(code, 'markdown', 'const', 'keyword.declaration')
    assertHas(code, 'markdown', '1', 'number')
    assertHas(code, 'markdown', '// one', 'comment')
    expect(scopeOf(code, 'markdown', '\n\ntext after\n')).toBeNull()
  })

  it('markdown: resolves fence aliases, closes on a longer fence, and keeps unknown languages literal', () => {
    assertHas('~~~sh\ncurl -X GET\n~~~~\nafter\n', 'markdown', 'curl', 'function.call')
    assertHas('```notalanguage\nconst a = 1\n```\n', 'markdown', '\nconst a = 1\n', 'string')
    // An unterminated fence highlights to the end and loses no text.
    const open = '```json\n{"a": 1'
    expect(
      runs(open, 'markdown')
        .map(([t]) => t)
        .join(''),
    ).toBe(open)
    assertHas(open, 'markdown', '"a"', 'property')
  })

  it('markdown: closes a fence only with a run as long, and scopes HTML comments', () => {
    const code = '````md\n```js\nx\n```\n````\n\n<!-- note -->\n'
    assertHas(code, 'markdown', '\n```js\nx\n```\n', 'string')
    assertHas(code, 'markdown', '<!-- note -->', 'comment')
  })

  it('ocaml: does not close a comment on `*)` inside a string inside it', () => {
    assertHas('(* a "*)" b *) let x = 1\n', 'ocaml', 'let', 'keyword.declaration')
  })

  it('javascript: reads JSX children as text, so an apostrophe does not open a string', () => {
    const code = "const el = <p>Don't {name} stop</p>\nconst x = 'y'\n"
    expect(scopeOf(code, 'javascript', "Don't ")).toBeNull()
    assertHas(code, 'javascript', '{', 'interpolation')
    assertHas(code, 'javascript', "'y'", 'string')
  })

  it('javascript: tracks nested elements, fragments and self-closing tags in JSX children', () => {
    const code = "const App = () => (\n  <>\n    <Item a={1} />\n    <b>it's</b>\n  </>\n)\nconst s = 'z'\n"
    assertHas(code, 'javascript', 'Item', 'tag')
    expect(scopeOf(code, 'javascript', "it's")).toBeNull()
    assertHas(code, 'javascript', '</>', 'punctuation.bracket')
    assertHas(code, 'javascript', "'z'", 'string')
  })

  it('javascript: does not read TypeScript generics or assertions as JSX', () => {
    const code =
      "const id = <T>(x: T) => x\nconst n = <string>value\nconst f = <T extends object>(o: T) => o\nconst s = 'a'\n"
    expect(scoped(code, 'javascript').some(([, s]) => s === 'tag')).toBeFalsy()
    assertHas(code, 'javascript', "'a'", 'string')
  })

  it.each(['<T = unknown>', '<T=unknown>', '<T\n = unknown>', '<T extends object = {}>'])(
    'javascript: keeps defaulted generic %s in code mode',
    (parameters) => {
      const code = `const identity = ${parameters}(value: T) => value;\nexport const answer = 42;\n`
      expect(scoped(code, 'javascript').filter(([, scope]) => scope === 'tag')).toEqual([])
      assertHas(code, 'javascript', 'export', 'keyword.import')
      assertHas(code, 'javascript', '42', 'number')
    },
  )

  it('does not read an assertion to a non-builtin type as an element', () => {
    const code =
      'const el = <HTMLElement>document.getElementById("x")\nconst s = <Store>container.get<Store>(KEY)\nconst n: number = 1\nfunction f() { return "it\'s" }\n'
    expect(scoped(code, 'javascript').some(([, s]) => s === 'tag')).toBeFalsy()
    assertHas(code, 'javascript', 'getElementById', 'function.method')
    assertHas(code, 'javascript', '"it\'s"', 'string')
  })

  it('still reads an element without attributes as JSX when its line closes it or ends', () => {
    const code = "const b = <Button>Don't save</Button>\nreturn (\n  <div>\n    <p>It's {x}</p>\n  </div>\n)\n"
    expect(scopeOf(code, 'javascript', "Don't save")).toBeNull()
    expect(scopeOf(code, 'javascript', "It's ")).toBeNull()
    assertHas(code, 'javascript', 'div', 'tag')
  })

  it('javascript: scopes functions assigned to a name, and capitalised calls as calls rather than types', () => {
    const code = "function Card() {}\nconst App = () => null\nclass Foo extends Bar {}\nthrow Error('x')\nnew Date()\n"
    assertHas(code, 'javascript', 'Card', 'function')
    assertHas(code, 'javascript', 'App', 'function')
    assertHas(code, 'javascript', 'Foo', 'type')
    assertHas(code, 'javascript', 'Error', 'function.call')
    assertHas(code, 'javascript', 'Date', 'function.call')
  })

  it('bash: scopes command names, but not the arguments on a continued line', () => {
    const code = 'curl -X POST \\\n  payload.json\ncat f | grep x && ./run.sh\nif true; then x=$(date); fi\n'
    assertHas(code, 'bash', 'curl', 'function.call')
    assertHas(code, 'bash', 'grep', 'function.call')
    assertHas(code, 'bash', './run.sh', 'function.call')
    assertHas(code, 'bash', 'date', 'function.call')
    assertHas(code, 'bash', 'if', 'keyword.control')
    expect(scopeOf(code, 'bash', 'payload.json')).not.toBe('function.call')
  })

  it('yaml: keeps the string color on the wrapped lines of a plain scalar', () => {
    const code = 'info:\n  description: one\n    two\n  title: t\n'
    assertHas(code, 'yaml', 'two', 'string')
    assertHas(code, 'yaml', 'title', 'property')
  })

  it('sql: scopes T-SQL and PL/SQL keywords and types', () => {
    const code = "DECLARE @n INT;\nPRINT 'x';\nEXEC dbo.run;\nv VARCHAR2(10);\nGO\n"
    for (const word of ['DECLARE', 'PRINT', 'EXEC', 'GO']) {
      assertHas(code, 'sql', word, 'keyword.control')
    }
    assertHas(code, 'sql', 'VARCHAR2', 'type.builtin')
    // Common column names stay plain.
    expect(scopeOf('SELECT level, top FROM t\n', 'sql', 'level')).toBeUndefined()
  })

  it('javascript: reads a regex after a control condition, and colours a tagged template tag', () => {
    const code = 'if (ok) /^a+$/.test(s)\nwhile (x) /b/g.exec(t)\nconst q = gql`query`\nconst r = a / b / c\n'
    assertHas(code, 'javascript', '/^a+$/', 'regexp')
    assertHas(code, 'javascript', '/b/g', 'regexp')
    assertHas(code, 'javascript', 'gql', 'function.call')
    expect(scoped(code, 'javascript').filter(([, s]) => s === 'regexp')).toHaveLength(2)
  })

  it.each(['\n', '\r\n', ' '])(
    'typescript: does not read the next statement as a const assertion name: %j',
    (space) => {
      const code = `const config = {} as${space}const\nexport const x = 1\nconst data = [] as const\nfunction run() {}`
      expect(scopeOf(code, 'typescript', 'export')).toBe('keyword.import')
      expect(scopeOf(code, 'typescript', 'function')).toBe('keyword.declaration')
      expect(scopeOf(code, 'typescript', 'config')).toBe('variable')
      expect(scopeOf(code, 'typescript', 'x')).toBe('variable')
      expect(
        tokenize(code, 'typescript')
          .map(({ text }) => text)
          .join(''),
      ).toBe(code)
    },
  )

  it('javascript: scopes the name a const, let or var declares', () => {
    const code =
      'const total = items.length\nlet x = 1, y\nconst App = () => null\nconst { a } = obj\nfor (const k of keys) {}\nexport const enum Color { Red }\nconst n: number = 1\n'
    assertHas(code, 'javascript', 'total', 'variable')
    assertHas(code, 'javascript', 'x', 'variable')
    assertHas(code, 'javascript', 'k', 'variable')
    assertHas(code, 'javascript', 'n', 'variable')
    // An arrow function keeps the function scope, and patterns stay plain.
    assertHas(code, 'javascript', 'App', 'function')
    expect(scoped(code, 'javascript').some(([t, s]) => t === 'a' && s === 'variable')).toBeFalsy()
    assertHas(code, 'javascript', 'enum', 'keyword.declaration')
    assertHas(code, 'javascript', 'const', 'keyword.declaration')
  })

  it('bash: scopes unquoted arguments as strings, after the command, keywords and flags', () => {
    const code = 'docker compose up -d /tmp/x\nif true; then echo hi; fi\nx=1 ls ~/bin\n'
    assertHas(code, 'bash', 'docker', 'function.call')
    assertHas(code, 'bash', 'compose', 'string')
    assertHas(code, 'bash', '/tmp/x', 'string')
    assertHas(code, 'bash', '-d', 'constant')
    assertHas(code, 'bash', 'then', 'keyword.control')
    assertHas(code, 'bash', 'echo', 'function.builtin')
    assertHas(code, 'bash', 'x', 'variable')
  })

  it('javascript: reads a keyword followed by a colon as an object key', () => {
    const code =
      "const schema = { type: 'object', from: a, default: 1 }\ntype A = { type?: string }\nswitch (x) {\n  case 1: return 2\n  default: return 3\n}\nexport default { responses: { default: { description: 'x' } } }\n"
    expect(
      scoped(code, 'javascript')
        .filter(([t]) => t === 'type')
        .map(([, s]) => s),
    ).toEqual(['property', 'keyword.declaration', 'property'])
    assertHas(code, 'javascript', 'from', 'property')
    expect(
      scoped(code, 'javascript')
        .filter(([t]) => t === 'default')
        .map(([, s]) => s),
    ).toEqual(['property', 'keyword.control', 'keyword.control', 'property'])
  })

  it('javascript: reads method names that are also keywords, and private fields', () => {
    const code = 'class L { #n = 0; static of(x) { return this.#n } get(k) {} get size() {} }\nfor (const a of b) {}\n'
    assertHas(code, 'javascript', 'of', 'function.call')
    assertHas(code, 'javascript', 'of', 'keyword.operator')
    assertHas(code, 'javascript', 'get', 'function.call')
    assertHas(code, 'javascript', 'get', 'keyword.declaration')
    assertHas(code, 'javascript', '#n', 'variable.member')
  })

  it('markdown: highlights closed front matter as YAML', () => {
    const code = '---\ntitle: Hi\ndraft: false\n---\n\n# Hello\n'
    assertHas(code, 'markdown', 'title', 'property')
    assertHas(code, 'markdown', 'false', 'boolean')
    // The last line of the block is not a setext heading.
    assertHas(code, 'markdown', '# Hello', 'heading')
    expect(scoped(code, 'markdown').filter(([, s]) => s === 'heading')).toHaveLength(1)
  })

  it('markdown: leaves an unclosed or later `---` alone', () => {
    const unclosed = '---\n\nSome text *here*\n'
    assertHas(unclosed, 'markdown', '---', 'punctuation')
    assertHas(unclosed, 'markdown', '*here*', 'emphasis')
    // Not at the start, so a line followed by `---` is a heading again.
    assertHas('Intro\n\n---\ntitle: x\n---\n', 'markdown', 'title: x\n---', 'heading')
  })

  it('markdown: highlights HTML that starts a line, and keeps Markdown around it', () => {
    const code =
      '<div align="center">\n  <img src="logo.png" />\n</div>\n\n<Steps>\nUse `api.md` here\n\n```js\nconst a = 1\n```\n</Steps>\n\n<b>Note</b> read **this**\n'
    assertHas(code, 'markdown', 'align', 'tag.attribute')
    assertHas(code, 'markdown', '"logo.png"', 'string')
    assertHas(code, 'markdown', 'Steps', 'tag')
    // The lines inside a component stay Markdown, fences included.
    assertHas(code, 'markdown', '`api.md`', 'string')
    assertHas(code, 'markdown', 'const', 'keyword.declaration')
    // Only the tag is HTML when text follows it on the line.
    assertHas(code, 'markdown', '**this**', 'strong')
  })

  it('markdown: runs a script block to its closing tag, blank lines included', () => {
    const code = '<script>\nconst a = 1\n\nconst b = 2\n</script>\n# After\n'
    expect(
      scoped(code, 'markdown')
        .filter(([t]) => t === 'const')
        .map(([, s]) => s),
    ).toEqual(['keyword.declaration', 'keyword.declaration'])
    assertHas(code, 'markdown', '# After', 'heading')
    assertHas('See <https://x.com> now\n', 'markdown', '<https://x.com>', 'link')
  })

  it('http: highlights an XML body and still finds the next message', () => {
    const code =
      'POST /soap HTTP/1.1\nContent-Type: application/xml\n\n<user id="1"><name>Ada</name></user>\n\n###\nGET /x HTTP/1.1\n'
    assertHas(code, 'http', 'user', 'tag')
    assertHas(code, 'http', 'id', 'tag.attribute')
    assertHas(code, 'http', 'GET', 'keyword.control')
  })

  it('php: highlights script and style bodies in a template, around PHP regions', () => {
    const code =
      '<p>x</p>\n<script>\n  const total = <?= count($items) ?>;\n  const ok = true\n</script>\n<style>.a { color: red }</style>\n'
    assertHas(code, 'php', 'total', 'variable')
    assertHas(code, 'php', 'count', 'function.builtin')
    // The script resumes after the PHP region.
    assertHas(code, 'php', 'ok', 'variable')
    assertHas(code, 'php', 'color', 'property')
    assertHas(code, 'php', 'style', 'tag')
  })

  it('css: scopes the condition of @media and @supports', () => {
    const code = '@media screen and (max-width: 600px) { a { color: red } }\n@supports (display: grid) { b { c: d } }\n'
    assertHas(code, 'css', 'and', 'keyword')
    assertHas(code, 'css', 'max-width', 'property')
    assertHas(code, 'css', '600', 'number')
    assertHas(code, 'css', 'screen', 'constant')
    assertHas(code, 'css', 'display', 'property')
    assertHas(code, 'css', 'color', 'property')
  })

  it('css: stays linear on a long identifier in an at-rule condition', () => {
    // The feature rule scanned the name and failed for want of a colon at every
    // position, because nothing consumed underscores: 400ms at 16k characters.
    const code = `@media ${'_'.repeat(64_000)} {}`
    tokenize(code, 'css') // compile the grammar outside the measurement

    const start = performance.now()
    const tokens = tokenize(code, 'css')
    const elapsed = performance.now() - start

    expect(tokens.map((t) => t.text).join('')).toBe(code)
    expect(elapsed, `a ${64_000}-character condition took ${elapsed.toFixed(0)}ms`).toBeLessThan(1000)
  })

  it('markdown: closes a raw HTML block on a closing tag in any case', () => {
    const code = '<script>\nconst a = 1\n</SCRIPT>\n# Heading\n**bold**\n<PRE>\nx\n</pre>\n*em*\n'
    assertHas(code, 'markdown', '# Heading', 'heading')
    assertHas(code, 'markdown', '**bold**', 'strong')
    assertHas(code, 'markdown', '*em*', 'emphasis')
  })

  it('markdown: does not end an HTML line at a > inside a quoted value', () => {
    const code = '<div title="a>b" data-id="x"> **bold**\n'
    assertHas(code, 'markdown', '"a>b"', 'string')
    assertHas(code, 'markdown', 'data-id', 'tag.attribute')
    assertHas(code, 'markdown', '**bold**', 'strong')
  })

  it.each([
    '"?>"',
    "'?>'",
    String.raw`"escaped \" ?>"`,
    '"</script>"',
    "'</script>'",
    '/* ?> </script> */ "value"',
    '// </script>\n"value"',
  ])('php: keeps quoted delimiters and comments inside a script hole: %s', (value) => {
    const code = `<script>const a = <?= ${value} . $name ?>; const ok = true;</script>`
    expect(
      tokenize(code, 'php')
        .map(({ text }) => text)
        .join(''),
    ).toBe(code)
    expect(scopeOf(code, 'php', '$name')).toBe('variable')
    expect(scopeOf(code, 'php', 'ok')).toBe('variable')
    expect(scopeOf(code, 'php', 'true')).toBe('boolean')
  })

  it('php: ignores a closing style tag inside a PHP string', () => {
    const code = '<style>.a { content: <?= "</style>" . $name ?>; color: red }</style>'
    expect(
      tokenize(code, 'php')
        .map(({ text }) => text)
        .join(''),
    ).toBe(code)
    expect(scopeOf(code, 'php', '$name')).toBe('variable')
    expect(scopeOf(code, 'php', 'color')).toBe('property')
    expect(scopeOf(code, 'php', 'red')).toBe('constant')
  })

  it('php: preserves an unclosed quoted hole through the end of input', () => {
    const code = '<script>const a = <?= "?> </script> still PHP'
    expect(
      tokenize(code, 'php')
        .map(({ text }) => text)
        .join(''),
    ).toBe(code)
    expect(scopeOf(code, 'php', '"?> </script> still PHP')).toBe('string')
  })

  it('php: keeps the script state across a PHP region inside a string', () => {
    const code = '<p></p><script>const name = "<?= $name ?>"; const ok = true;</script>\n'
    assertHas(code, 'php', '$name', 'variable')
    assertHas(code, 'php', 'ok', 'variable')
    assertHas(code, 'php', 'true', 'boolean')
    expect(scoped(code, 'php').some(([t, s]) => t.includes('const ok') && s === 'string')).toBeFalsy()
  })

  it('markdown: closes a fence only on a run of its own character', () => {
    const code = '```js\nconst a = 1\n~~~\nconst b = 2\n```\n# After\n'
    expect(scoped(code, 'markdown').filter(([t]) => t === 'const')).toHaveLength(2)
    assertHas(code, 'markdown', '# After', 'heading')
    // A backtick run inside a tilde fence is body text, not a closing fence.
    const tilde = '~~~py\na = 1\n```\nb = 2\n~~~~\n# After\n'
    expect(scoped(tilde, 'markdown').some(([t, s]) => t === '```' && s === 'punctuation')).toBeFalsy()
    assertHas(tilde, 'markdown', '2', 'number')
    assertHas(tilde, 'markdown', '# After', 'heading')
  })

  it('markdown: does not overflow the stack on fences nested thousands deep', () => {
    const code = '```md\n'.repeat(3000)
    expect(
      tokenize(code, 'markdown')
        .map((t) => t.text)
        .join(''),
    ).toBe(code)
  })

  it('javascript: does not read a member named if, while or for as a control statement', () => {
    const code = 'obj.if(ok) / a / b\nx.while(y) / c / d\nz?.for(w) / e / f\n'
    expect(scoped(code, 'javascript').some(([, s]) => s === 'regexp')).toBeFalsy()
  })

  it('bash: scopes the name a declaration sets rather than reading it as an argument', () => {
    const code = 'export API_KEY=$(cat key.txt)\nlocal -r name="x"\nreadonly X\n'
    assertHas(code, 'bash', 'API_KEY', 'variable')
    assertHas(code, 'bash', 'cat', 'function.call')
    assertHas(code, 'bash', '-r', 'constant')
    assertHas(code, 'bash', 'name', 'variable')
    assertHas(code, 'bash', 'X', 'variable')
    expect(scoped(code, 'bash').some(([t, s]) => t.includes('API_KEY') && s === 'string')).toBeFalsy()
  })

  it('rust: reads .await as a keyword, self as the receiver and r#type as a name', () => {
    const code = 'pub async fn get(&self) -> Self {\n  let r#type = 1;\n  client.get(url).send().await?\n}\n'
    assertHas(code, 'rust', 'await', 'keyword.control')
    assertHas(code, 'rust', 'self', 'variable.builtin')
    assertHas(code, 'rust', 'Self', 'type')
    expect(scoped(code, 'rust').some(([t]) => t === 'type')).toBeFalsy()
  })

  it('python: reads a case with its body on the same line as a keyword', () => {
    const code = 'match r.status_code:\n    case 200: return r.json()\n    case _: raise X\ncase = 1\n'
    expect(
      scoped(code, 'python')
        .filter(([t]) => t === 'case')
        .map(([, s]) => s),
    ).toEqual(['keyword.control', 'keyword.control'])
  })

  it('typescript: names a generic arrow function', () => {
    const code = 'const id = <T,>(x: T) => x\nconst f = <T extends string>(x: T): T => x\n'
    assertHas(code, 'typescript', 'id', 'function')
    assertHas(code, 'typescript', 'f', 'function')
  })

  it('css: gives a custom property the same scope where it is used as where it is defined', () => {
    const code = '.a { --brand: #0af; color: var(--brand, red); margin: --gap; }\n'
    expect(
      scoped(code, 'css')
        .filter(([t]) => t.startsWith('--'))
        .map(([, s]) => s),
    ).toEqual(['property', 'property', 'property'])
  })

  it('scss: reads a variable definition as a value and a variable reference whole', () => {
    const code = '$brand: red;\n.a { $gap: 2px; color: $brand; margin: $gap; }\n'
    assertHas(code, 'scss', '$brand', 'variable')
    assertHas(code, 'scss', '$gap', 'variable')
    assertHas(code, 'scss', 'red', 'constant')
    expect(scoped(code, 'scss').some(([, s]) => s === 'tag')).toBeFalsy()
    expect(scoped(code, 'scss').filter(([t]) => t === '$brand')).toHaveLength(2)
  })

  it('less: reads @name: as a variable but keeps @media and @page :first at-rules', () => {
    const code = '@brand: red;\n.a { color: @brand; }\n@media screen { }\n@page :first { margin: 0 }\n'
    expect(scoped(code, 'less').filter(([t]) => t === '@brand')).toEqual([
      ['@brand', 'variable'],
      ['@brand', 'variable'],
    ])
    assertHas(code, 'less', '@media', 'keyword')
    assertHas(code, 'less', '@page', 'keyword')
  })

  it('swift: reads regex literals but leaves division alone', () => {
    const code = 'let a = #/\\d+/#\nlet b = ##/x/#y/##\nlet c = /[a-z]+/\nif s.contains(/x+/) {}\nlet d = n / 2 / 3\n'
    assertHas(code, 'swift', '#/\\d+/#', 'regexp')
    assertHas(code, 'swift', '##/x/#y/##', 'regexp')
    assertHas(code, 'swift', '/[a-z]+/', 'regexp')
    assertHas(code, 'swift', '/x+/', 'regexp')
    expect(scoped('let d = n / 2 / 3\n', 'swift').some(([, s]) => s === 'regexp')).toBeFalsy()
  })

  it('swift: reads the newer modifiers', () => {
    const code = 'nonisolated func f(x: consuming Foo, y: borrowing Bar) {}\n'
    assertHas(code, 'swift', 'nonisolated', 'keyword.declaration')
    assertHas(code, 'swift', 'consuming', 'keyword.declaration')
    assertHas(code, 'swift', 'borrowing', 'keyword.declaration')
  })

  it('diff: reads context and normal diffs', () => {
    const code =
      '*** a.txt\n--- b.txt\n***************\n*** 1,2 ****\n--- 1,3 ----\nIndex: f\n=====\n2c2\n< old\n---\n> new\n'
    assertHas(code, 'diff', '*** a.txt', 'heading')
    assertHas(code, 'diff', '***************', 'keyword')
    assertHas(code, 'diff', '*** 1,2 ****', 'keyword')
    assertHas(code, 'diff', '--- 1,3 ----', 'keyword')
    assertHas(code, 'diff', 'Index: f', 'comment')
    assertHas(code, 'diff', '=====', 'comment')
    assertHas(code, 'diff', '2c2', 'keyword')
    assertHas(code, 'diff', '< old', 'diff.minus')
    assertHas(code, 'diff', '> new', 'diff.plus')
  })

  it('ruby: reads a method called without parentheses as a call', () => {
    const code = 'puts list.length\nlist.map { |v| v.to_s }.join\nuser&.name\np total\np = 1\n'
    assertHas(code, 'ruby', 'length', 'function.method')
    assertHas(code, 'ruby', 'to_s', 'function.method')
    assertHas(code, 'ruby', 'join', 'function.method')
    assertHas(code, 'ruby', 'name', 'function.method')
    expect(
      scoped(code, 'ruby')
        .filter(([t]) => t === 'p')
        .map(([, s]) => s),
    ).toEqual(['function.builtin'])
  })

  it('go: reads a package-qualified type where a type goes, and a value elsewhere', () => {
    const code =
      'func h(w http.ResponseWriter, r *http.Request) http.Handler {\n\treturn http.StatusOK\n}\nvar c = &http.Client{}\nd := 2*time.Second\nfunc TestX(t *testing.T) {}\n'
    for (const type of ['ResponseWriter', 'Request', 'Handler', 'Client', 'T']) {
      assertHas(code, 'go', type, 'type')
    }
    assertHas(code, 'go', 'StatusOK', 'variable.member')
    assertHas(code, 'go', 'Second', 'variable.member')
  })

  it('nginx: reads the values nginx defines and the name of an upstream', () => {
    const code =
      'error_log logs/error.log warn;\nevents { use epoll; }\nrewrite ^/a /b permanent;\nupstream docs_backend {\n  server a:1;\n}\n'
    assertHas(code, 'nginx', 'warn', 'constant.builtin')
    assertHas(code, 'nginx', 'epoll', 'constant.builtin')
    assertHas(code, 'nginx', 'permanent', 'keyword')
    assertHas(code, 'nginx', 'docs_backend', 'type')
    expect(scoped(code, 'nginx').some(([t]) => t === 'error')).toBeFalsy()
  })

  it('haskell: reads the names in an import list', () => {
    const code =
      'import Data.List (unfoldr, intercalate)\nimport Control.Applicative ((<|>), Alternative(..))\nimport Data.Text\n  ( pack\n  , Text\n  )\nmain = print 1\n'
    assertHas(code, 'haskell', 'unfoldr', 'function')
    assertHas(code, 'haskell', 'intercalate', 'function')
    assertHas(code, 'haskell', '<|>', 'operator')
    assertHas(code, 'haskell', 'Alternative', 'type')
    assertHas(code, 'haskell', 'pack', 'function')
    assertHas(code, 'haskell', 'Text', 'type')
    assertHas(code, 'haskell', 'main', 'function')
  })

  it('kotlin: reads package and import paths, and the newer modifiers', () => {
    const code =
      'package com.example.shop\nimport java.util.*\ntailrec fun f() {}\nvalue class A(val x: Int)\nval value = 1\n'
    assertHas(code, 'kotlin', 'com.example.shop', 'namespace')
    assertHas(code, 'kotlin', 'java.util.*', 'namespace')
    assertHas(code, 'kotlin', 'tailrec', 'keyword.declaration')
    expect(
      scoped(code, 'kotlin')
        .filter(([t]) => t === 'value')
        .map(([, s]) => s),
    ).toEqual(['keyword.declaration', 'variable'])
  })

  it('cpp: reads a call with explicit template arguments as a call', () => {
    const code = 'auto a = std::any_cast<int>(x);\nauto b = std::get<std::vector<int>>(t);\nstd::vector<int> v(3);\n'
    assertHas(code, 'cpp', 'any_cast', 'function.call')
    assertHas(code, 'cpp', 'get', 'function.call')
    expect(scopeOf(code, 'cpp', 'vector')).not.toBe('function.call')
  })

  it('javascript: reads import attributes', () => {
    const code = "import data from './x.json' with { type: 'json' }\nconst o = { with: 1 }\n"
    expect(
      scoped(code, 'javascript')
        .filter(([t]) => t === 'with')
        .map(([, s]) => s),
    ).toEqual(['keyword.import', 'property'])
  })

  it('typescript: reads the names in a parameter list as parameters', () => {
    const code = [
      'function f(a, b: string, { c, d: e }) {}',
      'const g = async <T,>({ x }: Props<T>, ...rest: T[]): Promise<void> => {}',
      'function* gen(m: Map<K, V> = new Map(), n = [1, 2]) {}',
      'list.map((item) => item)',
      'foo(a, b => c)',
      'class P { constructor(private readonly svc: Service) {} }',
      '',
    ].join('\n')
    for (const name of ['a', 'b', 'c', 'e', 'x', 'rest', 'm', 'n', 'item']) {
      assertHas(code, 'typescript', name, 'variable.parameter')
    }
    assertHas(code, 'typescript', 'f', 'function')
    assertHas(code, 'typescript', 'd', 'property')
    assertHas(code, 'typescript', 'K', 'type')
    assertHas(code, 'typescript', 'V', 'type')
    assertHas(code, 'typescript', 'private', 'keyword.declaration')
    // A call's arguments are not parameters, even next to an arrow function.
    expect(
      scoped('foo(a, b => c)\n', 'typescript').some(([t, s]) => t === 'a' && s === 'variable.parameter'),
    ).toBeFalsy()
  })

  it.each(['javascript', 'typescript'])('%s: keeps regex defaults inside the parameter expression', (lang) => {
    const code = 'function f(re = /a,b[)]/, next = 2) { return true }'
    expect(scoped(code, lang).filter(([, scope]) => scope === 'regexp')).toEqual([['/a,b[)]/', 'regexp']])
    expect(scoped(code, lang).filter(([, scope]) => scope === 'variable.parameter')).toEqual([
      ['re', 'variable.parameter'],
      ['next', 'variable.parameter'],
    ])
    expect(scopeOf(code, lang, 'return')).toBe('keyword.control')
    expect(scopeOf(code, lang, 'true')).toBe('boolean')
  })

  it.each(['javascript', 'typescript'])('%s: distinguishes quoted destructuring keys from bindings', (lang) => {
    const code = String.raw`function f({"x-y": x, 'a\'b': renamed = 1, "nested": { value }}) { return x }`
    expect(scoped(code, lang).filter(([, scope]) => scope === 'string')).toEqual([
      ['"x-y"', 'string'],
      [String.raw`'a\'b'`, 'string'],
      ['"nested"', 'string'],
    ])
    expect(scoped(code, lang).filter(([, scope]) => scope === 'variable.parameter')).toEqual([
      ['x', 'variable.parameter'],
      ['renamed', 'variable.parameter'],
      ['value', 'variable.parameter'],
    ])
    expect(scopeOf(code, lang, 'return')).toBe('keyword.control')
  })

  it.each(['Point(x=0)', 'value if value == 0', '"="'])('python: reads case keywords with %s', (pattern) => {
    const code = `match value:\n    case ${pattern}: return True\n`
    expect(scopeOf(code, 'python', 'case')).toBe('keyword.control')
    expect(scopeOf(code, 'python', 'return')).toBe('keyword.control')
  })

  it('python: keeps assignments to case as names even when their value contains a colon', () => {
    const code = 'case = {"x": 1}\ncase = lambda x: x\n'
    expect(scoped(code, 'python').filter(([text]) => text === 'case')).toEqual([])
  })
  it.each(['', '  '])('haskell: ends imports before declarations indented by %j', (indent) => {
    for (const tail of ['', ' (sort)', '\n    (sort)', ' qualified as L hiding (sort)', ' -- trailing comment']) {
      const code = `module Main where\n${indent}import Data.List${tail}\n${indent}main = print 123\n${indent}other = True\n`
      expect(scopeOf(code, 'haskell', 'print')).toBe('function.builtin')
      expect(scopeOf(code, 'haskell', '123')).toBe('number')
      expect(scopeOf(code, 'haskell', 'True')).toBe('boolean')
    }
    expect(scopeOf('module Main where { import Data.List; main = print 123 }', 'haskell', '123')).toBe('number')
  })

  it.each(['[/a,b[)]/]', '(/a,b[)]/)', 'wrap([(/a,b[)]/)])'])(
    'typescript: keeps nested regex default %s intact',
    (value) => {
      const code = `function f(x = ${value}, next = 2) { return true }`
      expect(scoped(code, 'typescript').filter(([, scope]) => scope === 'regexp')).toEqual([['/a,b[)]/', 'regexp']])
      expect(scoped(code, 'typescript').filter(([, scope]) => scope === 'variable.parameter')).toEqual([
        ['x', 'variable.parameter'],
        ['next', 'variable.parameter'],
      ])
      expect(scopeOf(code, 'typescript', 'return')).toBe('keyword.control')
    },
  )

  it.each(['foo<T, U>()', 'foo<Map<K, V>, U>()', 'wrap(foo<T, U>())'])(
    'typescript: keeps generic default %s intact',
    (value) => {
      const code = `function f(x = ${value}, next = 2) { return true }`
      expect(scoped(code, 'typescript').filter(([, scope]) => scope === 'variable.parameter')).toEqual([
        ['x', 'variable.parameter'],
        ['next', 'variable.parameter'],
      ])
      expect(scopeOf(code, 'typescript', 'U')).toBe('type')
      expect(scopeOf(code, 'typescript', 'return')).toBe('keyword.control')
    },
  )

  it('typescript: keeps comparisons and division as default expressions', () => {
    const code = 'function f(x = a < b, next = c > (d), ratio = [a / b]) {}'
    expect(scoped(code, 'typescript').filter(([, scope]) => scope === 'variable.parameter')).toEqual([
      ['x', 'variable.parameter'],
      ['next', 'variable.parameter'],
      ['ratio', 'variable.parameter'],
    ])
    expect(scoped(code, 'typescript').filter(([, scope]) => scope === 'regexp')).toEqual([])
  })

  it.each(['javascript', 'typescript'])('%s: distinguishes computed and numeric keys from bindings', (lang) => {
    const code =
      'function f({[key]: value, 1: first, [keys[index]]: { nested }}, [item, {name: renamed}]) { return value }'
    expect(scoped(code, lang).filter(([, scope]) => scope === 'variable.parameter')).toEqual([
      ['value', 'variable.parameter'],
      ['first', 'variable.parameter'],
      ['nested', 'variable.parameter'],
      ['item', 'variable.parameter'],
      ['renamed', 'variable.parameter'],
    ])
    expect(scopeOf(code, lang, '1')).toBe('number')
    expect(scopeOf(code, lang, 'return')).toBe('keyword.control')
  })
})
