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
    if (last && last[1] === token.scope) last[0] += token.text
    else out.push([token.text, token.scope])
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
        if (!target) unresolved.push(alias)
        else if (target !== grammar.name) misdirected.push(`${alias} -> ${target}, want ${grammar.name}`)
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
      if (!want) return
      const got = resolveLanguageName(name)
      if (got !== want) disagreeing.push(`${name} -> ${got ?? 'nothing'}, want ${want}`)
    }

    for (const [name, grammar] of Object.entries(byName)) check(name, grammar)
    // The lowlight aliases resolve in two hops: to a canonical name first,
    // and to that name's grammar second.
    for (const [alias, canonical] of Object.entries(lowlightLanguageMappings)) check(alias, byName[canonical] ?? null)

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
describe('cost stays linear in line length', () => {
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
      if (!baseline) throw new Error(`${lang} has no sample in test/samples.ts to measure against`)

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
