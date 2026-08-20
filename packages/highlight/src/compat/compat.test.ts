/**
 * `@scalar/code-highlight` compatibility.
 *
 * Two things are checked here. First, the four assertions that
 * `packages/code-highlight/src/code/highlight.test.ts` makes today, ported
 * verbatim (renamed to drop the `should` prefix this repo does not use) —
 * a drop-in has to pass the tests the thing it replaces passes.
 * Second, a differential run against the real lowlight pipeline — imported
 * straight from `@scalar/code-highlight`, so the comparison tracks the
 * package we are replacing rather than a snapshot of it — over the shared
 * sample corpus, because "it compiles and the four tests pass" is not the
 * same as "the page looks the same".
 *
 * What parity means, precisely:
 *
 * - the text a reader sees is byte-identical after entity decoding
 * - the `<pre><code class="…">` envelope is byte-identical
 * - line elements line up one for one, with the same text on each
 *
 * What parity deliberately does *not* mean: the same spans. Our scope
 * vocabulary is not highlight.js's, and matching its token boundaries exactly
 * would mean reimplementing its grammars. Colour differences are reported by
 * `pnpm compat:report` rather than asserted.
 */
import { describe, expect, it } from 'vitest'

import '../all'

import { syntaxHighlight as referenceHighlight } from '@scalar/code-highlight/code'
import { standardLanguages as referenceStandardLanguages } from '@scalar/code-highlight/languages'

import { colorAgreement } from '../../test/colors'
import { textFromHtml } from '../../test/html'
import { referenceLanguages } from '../../test/languages'
import { samples } from '../../test/samples'
import { hljsClass } from './hljs'
import { syntaxHighlight } from './index'
import { standardLanguages, unsupportedLanguages } from './languages'

// --- helpers ---------------------------------------------------------------

/** The `<code …>` opening tag, which carries the classes and the gutter vars. */
const envelope = (html: string): string => {
  return html.match(/<code[^>]*>/)?.[0] ?? ''
}

/** Text content of each `<span class="line">`, in order. */
const lineTexts = (html: string): string[] => {
  return [...html.matchAll(/<span class="line">(.*?)\n<\/span>/gs)].map((m) => textFromHtml(m[1]!))
}

/** Every distinct token class in the output. */
const classesOf = (html: string): Set<string> => {
  return new Set([...html.matchAll(/<span class="(hljs-[^"]*)">/g)].map((m) => m[1]!))
}

// --- the tests @scalar/code-highlight ships today --------------------------

describe('syntaxHighlight — ported from @scalar/code-highlight', () => {
  const defaultOptions = { lang: 'javascript', languages: referenceLanguages }

  const codeExample = `
    fetch('https://galaxy.scalar.com/planets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  `

  it('returns highlighted HTML for a given code string', () => {
    const result = syntaxHighlight(codeExample, defaultOptions)
    expect(result).toContain('class="hljs language-javascript"')
  })

  it('masks credentials in the code string', () => {
    const codeWithCredentials = `
      fetch('https://galaxy.scalar.com/planets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer secret'
        }
      })
    `

    const result = syntaxHighlight(codeWithCredentials, {
      ...defaultOptions,
      maskCredentials: ['secret'],
    })

    expect(result).toContain('<span class="credential"><span class="credential-value">secret</span></span>')
  })

  it('wraps lines when the option is enabled', () => {
    const result = syntaxHighlight(codeExample, {
      ...defaultOptions,
      lineNumbers: true,
    })
    expect(result).toContain('class="line"')
  })

  it('masks credentials containing special characters', () => {
    const result = syntaxHighlight(`\n      const secret = '(secret';\n    `, {
      ...defaultOptions,
      maskCredentials: ['(secret'],
    })

    expect(result).toContain('<span class="credential"><span class="credential-value">(secret</span></span>')
  })
})

// --- differential parity against the lowlight pipeline ---------------------

/** Sample corpus keyed by the language name a caller would pass. */
const corpus: [string, string][] = Object.entries(samples)

describe('parity with the lowlight pipeline', () => {
  for (const [lang, code] of corpus) {
    describe(lang, () => {
      const options = { lang, languages: referenceLanguages }
      const before = referenceHighlight(code, options)
      const after = syntaxHighlight(code, options)

      it('renders the same text', () => {
        expect(textFromHtml(after)).toBe(textFromHtml(before))
      })

      it('renders the same <code> envelope', () => {
        expect(envelope(after)).toBe(envelope(before))
      })

      it('renders the same lines, with the same gutter variables', () => {
        const beforeLines = referenceHighlight(code, {
          ...options,
          lineNumbers: true,
        })
        const afterLines = syntaxHighlight(code, {
          ...options,
          lineNumbers: true,
        })

        expect(envelope(afterLines)).toBe(envelope(beforeLines))
        expect(lineTexts(afterLines)).toEqual(lineTexts(beforeLines))
      })

      it('only emits classes highlight.js also emits', () => {
        // Every class we produce has to be one `code.css` already styles,
        // otherwise a token silently loses its colour after the swap.
        const known = new Set(Object.values(classesOf(referenceHighlight(code, options))))
        const styled = new Set([
          ...known,
          // Styled by code.css but not necessarily present in this sample.
          'hljs-comment',
          'hljs-quote',
          'hljs-number',
          'hljs-regexp',
          'hljs-string',
          'hljs-built_in',
          'hljs-title class_',
          'hljs-keyword',
          'hljs-title function_',
          'hljs-subst',
          'hljs-name',
          'hljs-attr',
          'hljs-attribute',
          'hljs-addition',
          'hljs-literal',
          'hljs-selector-tag',
          'hljs-type',
          'hljs-selector-attr',
          'hljs-selector-pseudo',
          'hljs-doctag',
          'hljs-section',
          'hljs-title',
          'hljs-selector-id',
          'hljs-template-variable',
          'hljs-variable',
          'hljs-strong',
          'hljs-bullet',
          'hljs-link',
          'hljs-meta',
          'hljs-symbol',
          'hljs-deletion',
          'hljs-formula',
          'hljs-emphasis',
          // Emitted by highlight.js, unstyled by code.css — harmless either way.
          'hljs-punctuation',
          'hljs-params',
          'hljs-property',
        ])

        const unexpected = [...classesOf(after)].filter((c) => !styled.has(c))
        expect(unexpected, `unstyled classes: ${unexpected.join(', ')}`).toEqual([])
      })
    })
  }
})

// --- edge cases the corpus does not reach ----------------------------------

describe('parity on edge cases', () => {
  const cases: [string, string, string][] = [
    ['empty string', 'json', ''],
    ['no trailing newline', 'json', '{"a": 1}'],
    ['trailing newline', 'json', '{"a": 1}\n'],
    ['blank lines in the middle', 'javascript', 'const a = 1;\n\n\nconst b = 2;\n'],
    ['only newlines', 'javascript', '\n\n\n'],
    ['html entities in source', 'javascript', 'const t = a < b && c > d;\n'],
    ['crlf line endings', 'javascript', 'const a = 1;\r\nconst b = 2;\r\n'],
    ['unicode', 'python', 'name = "héllo 🌍"\n'],
    ['tabs', 'go', 'func main() {\n\tprintln("hi")\n}\n'],
    ['unknown language', 'brainfuck', '+[----->+++<]>+.\n'],
    // `plaintext`, not `ruby`: this case exists to exercise the path where the
    // reference pipeline knows the language and we return no grammar, and we
    // now ship a grammar for every language the vendored reference registers
    // except this one. It is distinct from the `brainfuck` case above, which
    // is unknown to *both* pipelines.
    ['language with no grammar of ours', 'plaintext', 'just some text\n'],
    ['shared grammar', 'ruby', 'puts "hello"\n'],
    ['aliased language', 'py', 'x = 1\n'],
    ['aliased language via lowlight table', 'node', 'const a = 1;\n'],
  ]

  for (const [name, lang, code] of cases) {
    const options = { lang, languages: referenceLanguages }

    it(`${name}: same text`, () => {
      expect(textFromHtml(syntaxHighlight(code, options))).toBe(textFromHtml(referenceHighlight(code, options)))
    })

    it(`${name}: same envelope and lines`, () => {
      const before = referenceHighlight(code, {
        ...options,
        lineNumbers: true,
      })
      const after = syntaxHighlight(code, { ...options, lineNumbers: true })

      expect(envelope(after)).toBe(envelope(before))
      expect(lineTexts(after)).toEqual(lineTexts(before))
    })
  }

  it('does not let a language name break out of the class attribute', () => {
    // `lang` is the info string of a fenced block, so in a docs pipeline it
    // comes from the document being rendered rather than from the caller.
    const html = syntaxHighlight('const a = 1\n', {
      lang: '"><img src=x onerror=alert(1)>',
    })
    expect(html).not.toMatch(/<img/)
    expect(envelope(html)).toMatch(/^<code class="[^"]*">$/)
  })
})

// --- colour drift ----------------------------------------------------------

describe('colour agreement with code.css', () => {
  /**
   * Not a parity claim — a ratchet.
   *
   * The two highlighters disagree about plenty, and some of that is
   * deliberate: we scope f-string interiors as code rather than string, and
   * docstrings as comments rather than strings. What this guards is that a
   * grammar change or a remapped scope cannot quietly make a swap look worse
   * than it does today. `pnpm compat:report --detail` prints the
   * breakdown behind the number.
   */
  /**
   * The corpus this is measured over grew from 13 samples to 26, and then to
   * 41 when the last fifteen grammars got samples of their own, so the single
   * overall number is not comparable across those changes. It is split rather
   * than re-based wholesale, which keeps each earlier guarantee exact:
   * `ORIGINAL_FLOOR` ratchets the thirteen languages that shipped first,
   * `PREVIOUS_FLOOR` ratchets the twenty-six that existed before the third
   * round, and `FLOOR` ratchets the whole corpus at the level the newest
   * grammars actually reach.
   *
   * The new languages score lower mostly for a deliberate reason: this
   * library scopes brackets, commas and operators, and highlight.js does
   * not, so `hljs-punctuation` shows up in "classes only after" on nearly
   * every new row of `pnpm compat:report`. The third batch averages 67.9%
   * against 71.3% for the corpus before it, and the two lowest rows are the
   * same story rather than a mapping bug: on `http` (35.7%) highlight.js
   * leaves header values, `#` comments and status numbers unstyled, and on
   * `clojure` (51.5%) it reads `:require` and friends as symbols where this
   * library scopes them as properties.
   *
   * A language the reference pipeline cannot highlight is excluded from both.
   * Its "before" is uniformly unstyled, so agreement measures the share of
   * the sample *we* leave unscoped — the ratchet runs backwards, and the
   * cheapest way to satisfy it is to delete scopes from that grammar.
   * `mojo` is the only such language: highlight.js has no mojo grammar.
   */
  const FLOOR = 0.68
  const PREVIOUS_FLOOR = 0.7
  const ORIGINAL_FLOOR = 0.8

  /** Languages with no reference grammar, and so nothing to differ against. */
  const hasReference = (lang: string): boolean => lang in referenceLanguages

  /**
   * Pinned, because the exclusion above is otherwise a way to raise the
   * number: dropping a low-agreement language from the reference pipeline
   * would take its disagreement out of the average instead of fixing it.
   * Adding a grammar here has to be a deliberate edit with a reason.
   */
  const WITHOUT_REFERENCE = ['mojo']

  it('excludes only the languages highlight.js has no grammar for', () => {
    const excluded = corpus.map(([lang]) => lang).filter((lang) => !hasReference(lang))
    expect(excluded.sort()).toEqual(WITHOUT_REFERENCE)
  })

  /** The thirteen samples the corpus started with. */
  const ORIGINAL = new Set([
    'bash',
    'css',
    'diff',
    'go',
    'html',
    'javascript',
    'json',
    'markdown',
    'python',
    'rust',
    'sql',
    'typescript',
    'yaml',
  ])

  /**
   * The thirteen the second round added.
   *
   * Kept as its own set so the twenty-six samples that existed before the
   * third round still answer to the floor they were measured against. Folding
   * them into the whole-corpus number instead would nearly triple the
   * characters a regression could hide in: the same drift that trips a 70%
   * floor over 27k characters passes a 68% floor over 52k.
   */
  const SECOND = new Set([
    'cpp',
    'dockerfile',
    'elixir',
    'graphql',
    'haskell',
    'ini',
    'lua',
    'makefile',
    'matlab',
    'mojo',
    'nginx',
    'perl',
    'scala',
  ])

  const agreementOver = (langs: (lang: string) => boolean): number => {
    let compared = 0
    let differing = 0
    for (const [lang, code] of corpus) {
      if (!langs(lang)) continue
      const options = { lang, languages: referenceLanguages }
      const result = colorAgreement(referenceHighlight(code, options), syntaxHighlight(code, options))
      compared += result.compared
      differing += result.differing
    }
    return (compared - differing) / compared
  }

  it(`keeps at least ${FLOOR * 100}% of visible characters the same colour`, () => {
    const agreement = agreementOver(hasReference)
    expect(agreement, `colour agreement fell to ${(agreement * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(FLOOR)
  })

  it(`keeps at least ${PREVIOUS_FLOOR * 100}% on the corpus as it stood before the third round`, () => {
    const agreement = agreementOver((lang) => (ORIGINAL.has(lang) || SECOND.has(lang)) && hasReference(lang))
    expect(agreement, `colour agreement fell to ${(agreement * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(
      PREVIOUS_FLOOR,
    )
  })

  it(`keeps at least ${ORIGINAL_FLOOR * 100}% on the languages that shipped before`, () => {
    // The number this change must not move. Splitting it out is what makes
    // the lower whole-corpus floor above an honest re-measurement rather
    // than a loosened assertion.
    const agreement = agreementOver((lang) => ORIGINAL.has(lang) && hasReference(lang))
    expect(agreement, `colour agreement fell to ${(agreement * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(
      ORIGINAL_FLOOR,
    )
  })
})

// --- the contract the compat layer adds on its own -------------------------

describe('compat surface', () => {
  it('keeps the standardLanguages key set, so StandardLanguageKey is unchanged', () => {
    // Compared against the real export rather than a copy of it. A language
    // added to `@scalar/code-highlight` upstream would otherwise drop out of
    // `StandardLanguageKey` silently, with this test still green.
    expect(Object.keys(standardLanguages).sort()).toEqual(Object.keys(referenceStandardLanguages).sort())
  })

  it('reports exactly which standard languages have no grammar', () => {
    // Julia is a standard language in `@scalar/code-highlight` but has no
    // hand-written grammar in this zero-dependency package yet, so it renders
    // as plain escaped text alongside plaintext.
    expect(unsupportedLanguages).toEqual(['julia', 'plaintext'])
  })

  it('never throws on an unknown language, unlike resolveGrammar', () => {
    const html = syntaxHighlight('whatever', { lang: 'nonexistent' })
    expect(html).toContain('class="hljs language-nonexistent"')
    expect(html).toContain('whatever')
  })

  it('resolves unknown scopes up the chain', () => {
    expect(hljsClass('string.heredoc.bash')).toBe('hljs-string')
    expect(hljsClass('nonsense')).toBe(null)
  })

  it('treats prototype-named scopes as unmapped rather than inherited members', () => {
    // A grammar is data a caller supplies, so a scope named `constructor` must
    // not resolve off Object.prototype into a function.
    expect(hljsClass('constructor')).toBe(null)
    expect(hljsClass('toString')).toBe(null)
    expect(hljsClass('__proto__')).toBe(null)
  })

  it('ignores credentials shorter than three characters', () => {
    const html = syntaxHighlight('ab cd', {
      lang: 'plaintext',
      maskCredentials: 'ab',
    })
    expect(html).not.toContain('credential')
  })

  it('accepts a single credential string as well as an array', () => {
    const one = syntaxHighlight('token abcdef', {
      lang: 'plaintext',
      maskCredentials: 'abcdef',
    })
    const many = syntaxHighlight('token abcdef', {
      lang: 'plaintext',
      maskCredentials: ['abcdef'],
    })
    expect(one).toBe(many)
  })

  it('treats a language named after an Object member as unknown', () => {
    // ```constructor is a fence a document can write, and the lowlight
    // pipeline renders it as plain text rather than throwing. So must we.
    for (const lang of ['constructor', '__proto__', 'toString', 'valueOf', 'hasOwnProperty']) {
      const html = syntaxHighlight('x = 1', { lang })
      expect(html, lang).toContain(`language-${lang}`)
      expect(html, lang).toContain('x = 1')
    }
  })
})
