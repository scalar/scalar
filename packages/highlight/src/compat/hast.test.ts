/**
 * `toHast` has to agree with two things at once.
 *
 * It has to match our own string renderer, because a code block rendered
 * through Markdown and the same block rendered through `ScalarCodeBlock` must
 * not disagree about what is a keyword. And it has to stay inside the class
 * vocabulary highlight.js produces, because `code.css` is written against that
 * vocabulary and a class nobody styles is a token that silently loses colour.
 *
 * The first is exact: same input, same spans. The second is a floor, for the
 * same reason `compat.test.ts` uses one — our scope vocabulary is finer, so
 * some characters legitimately change colour.
 */
import type { ElementContent } from 'hast'
import { describe, expect, it } from 'vitest'

import '../all'

import { syntaxHighlight as referenceHighlight } from '@scalar/code-highlight/code'

import { colorAgreement } from '../../test/colors'
import { textFromHtml } from '../../test/html'
import { referenceLanguages } from '../../test/languages'
import { samples } from '../../test/samples'
import { STYLED_CLASSES } from '../../test/styled'
import { escapeHtml } from '../index'
import { toHast } from './hast'
import { standardLanguages, unsupportedLanguages } from './languages'
import { syntaxHighlight } from './syntax-highlight'

type WithClassName = { properties?: { className?: string[] } }

/** Serialize hast content the way the string renderer would write it. */
const toHtml = (nodes: ElementContent[]): string =>
  nodes
    .map((node) => {
      if (node.type === 'text') {
        return escapeHtml(node.value)
      }
      if (node.type !== 'element') {
        return ''
      }
      const className = (node as WithClassName).properties?.className?.join(' ') ?? ''
      return `<span class="${className}">${toHtml(node.children as ElementContent[])}</span>`
    })
    .join('')

/** The text a reader sees, with nothing about how it is marked up. */
const textOf = (nodes: ElementContent[]): string =>
  nodes
    .map((node) => {
      if (node.type === 'text') {
        return node.value
      }
      if (node.type !== 'element') {
        return ''
      }
      return textOf(node.children as ElementContent[])
    })
    .join('')

/** Every class the tree carries. */
const classesOf = (nodes: ElementContent[]): Set<string> => {
  const out = new Set<string>()

  const walk = (list: ElementContent[]): void => {
    for (const node of list) {
      if (node.type !== 'element') {
        continue
      }
      for (const name of (node as WithClassName).properties?.className ?? []) {
        out.add(name)
      }
      walk(node.children as ElementContent[])
    }
  }

  walk(nodes)
  return out
}

/** Strip the `<pre><code …>` wrapper the string renderer adds. */
const inner = (html: string): string => html.replace(/^<pre><code[^>]*>/, '').replace(/<\/code><\/pre>$/, '')

const corpus: [string, string][] = Object.entries(samples)

/** Languages with no reference grammar, and so nothing to differ against. */
const hasReference = (lang: string): boolean => lang in referenceLanguages

describe('toHast agrees with the string renderer', () => {
  for (const [lang, code] of corpus) {
    it(`${lang}: same spans as syntaxHighlight`, () => {
      const nodes = toHast(code, lang)

      expect(nodes, `${lang} has no grammar`).not.toBeNull()
      expect(toHtml(nodes as ElementContent[])).toBe(inner(syntaxHighlight(code, { lang })))
    })
  }
})

describe('toHast parity with the lowlight pipeline', () => {
  for (const [lang, code] of corpus) {
    describe(lang, () => {
      const before = referenceHighlight(code, { lang, languages: referenceLanguages })
      const nodes = toHast(code, lang) as ElementContent[]

      it.skipIf(!hasReference(lang))('renders the same text', () => {
        expect(textOf(nodes)).toBe(textFromHtml(before))
      })

      it('round-trips the source exactly', () => {
        expect(textOf(nodes)).toBe(code)
      })

      it.skipIf(!hasReference(lang))('only emits classes highlight.js also emits', () => {
        const known = new Set<string>()
        for (const match of before.matchAll(/class="([^"]*)"/g)) {
          for (const name of (match[1] ?? '').split(/\s+/)) {
            if (name.startsWith('hljs-')) {
              known.add(name)
            }
          }
        }

        const styled = new Set([...known, ...STYLED_CLASSES])
        const unexpected = [...classesOf(nodes)].filter((name) => !styled.has(name))

        expect(unexpected, `unstyled classes: ${unexpected.join(', ')}`).toEqual([])
      })
    })
  }
})

describe('toHast colour agreement', () => {
  const FLOOR = 0.68

  it(`keeps at least ${FLOOR * 100}% of visible characters the same colour`, () => {
    let compared = 0
    let differing = 0

    for (const [lang, code] of corpus) {
      if (!hasReference(lang)) {
        continue
      }

      const before = referenceHighlight(code, { lang, languages: referenceLanguages })
      const after = `<pre><code class="hljs language-${lang}">${toHtml(toHast(code, lang) as ElementContent[])}</code></pre>`
      const result = colorAgreement(before, after)

      compared += result.compared
      differing += result.differing
    }

    const agreement = (compared - differing) / compared

    expect(agreement, `colour agreement fell to ${(agreement * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(FLOOR)
  })
})

describe('toHast edge cases', () => {
  it('returns null for a language with no grammar', () => {
    expect(toHast('x', 'definitely-not-a-language')).toBeNull()
  })

  it('returns null rather than inheriting an Object member', () => {
    expect(toHast('x', 'constructor')).toBeNull()
    expect(toHast('x', '__proto__')).toBeNull()
  })

  it('reports every standard language that has no grammar as null', () => {
    for (const lang of unsupportedLanguages) {
      expect(toHast('x', lang), lang).toBeNull()
    }
  })

  it('resolves every other standard language to nodes', () => {
    for (const lang of Object.keys(standardLanguages)) {
      if (unsupportedLanguages.includes(lang)) {
        continue
      }
      expect(toHast('x', lang), lang).not.toBeNull()
    }
  })

  it('returns an empty list for empty input', () => {
    expect(toHast('', 'javascript')).toEqual([])
  })

  it('never puts two same-class spans next to each other', () => {
    const nodes = toHast('const value = 1 + 2', 'javascript') as ElementContent[]

    for (let i = 1; i < nodes.length; i++) {
      const previous = nodes[i - 1]
      const current = nodes[i]

      if (previous?.type !== 'element' || current?.type !== 'element') {
        continue
      }

      expect((previous as WithClassName).properties?.className?.join(' ')).not.toBe(
        (current as WithClassName).properties?.className?.join(' '),
      )
    }
  })

  it('applies a custom class prefix', () => {
    const nodes = toHast('const x = 1', 'javascript', { prefix: 'tok-' }) as ElementContent[]

    for (const name of classesOf(nodes)) {
      expect(name.startsWith('tok-'), name).toBe(true)
      expect(name.startsWith('hljs-'), name).toBe(false)
    }
  })

  it('leaves text unescaped in the tree, because escaping belongs to the serializer', () => {
    const nodes = toHast('const a = b < c && d > e', 'javascript') as ElementContent[]

    expect(textOf(nodes)).toBe('const a = b < c && d > e')
  })
})
