import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { compile } from './compile'
import { registerLanguage, resolveGrammar } from './registry'
import { escapeHtml, highlight, highlightBlock } from './render'
import { scopeClass } from './scopes'
import { tokenizeToArray } from './tokenize'
import type { Grammar } from './types'

const tiny: Grammar = {
  name: 'tiny',
  aliases: ['t'],
  states: {
    root: {
      rules: [
        { match: '\\d+', scope: 'number' },
        { match: '"', scope: 'string', push: 'string' },
        { match: '(let)(\\s+)(\\w+)', scope: ['keyword', null, 'variable'] },
      ],
    },
    string: {
      default: 'string',
      rules: [
        { match: '\\\\.', scope: 'string.escape' },
        { match: '"', scope: 'string', pop: true },
      ],
    },
  },
}

describe('compile', () => {
  it('rejects a grammar with no root state', () => {
    expect(() => compile({ name: 'x', states: {} } as Grammar)).toThrow(/no "root" state/)
  })

  it('rejects backreferences, which shift when rules are merged', () => {
    const grammar: Grammar = {
      name: 'x',
      states: { root: { rules: [{ match: '(a)\\1' }] } },
    }
    expect(() => compile(grammar)).toThrow(/backreferences are not supported/)
  })

  it('rejects a transition to a state that does not exist', () => {
    const grammar: Grammar = {
      name: 'x',
      states: { root: { rules: [{ match: 'a', push: 'nope' }] } },
    }
    expect(() => compile(grammar)).toThrow(/unknown state "nope"/)
  })

  it('rejects a transition to a state named after an Object member', () => {
    // A plain object lookup finds `constructor` on the prototype, so the
    // unknown-state check has to ask for own properties.
    for (const name of ['constructor', '__proto__', 'toString']) {
      const grammar: Grammar = {
        name: 'x',
        states: { root: { rules: [{ match: 'a', push: name }] } },
      }
      expect(() => compile(grammar), name).toThrow(new RegExp(`unknown state "${name}"`))
    }
  })

  it('rejects an include of a state named after an Object member', () => {
    for (const name of ['constructor', 'toString']) {
      const grammar: Grammar = {
        name: 'x',
        states: { root: { rules: [{ include: name }] } },
      }
      expect(() => compile(grammar), name).toThrow(new RegExp(`include of unknown state "${name}"`))
    }
  })

  it('rejects a circular include', () => {
    const grammar: Grammar = {
      name: 'x',
      states: {
        root: { rules: [{ include: 'a' }] },
        a: { rules: [{ include: 'root' }] },
      },
    }
    expect(() => compile(grammar)).toThrow(/circular include/)
  })

  it('rejects scoping more groups than the pattern has', () => {
    const grammar: Grammar = {
      name: 'x',
      states: {
        root: { rules: [{ match: '(a)', scope: ['keyword', 'string'] }] },
      },
    }
    expect(() => compile(grammar)).toThrow(/scopes 2 groups but the pattern has 1/)
  })

  it('splices includes in at their position, preserving priority', () => {
    const grammar: Grammar = {
      name: 'x',
      states: {
        root: {
          rules: [{ include: 'first' }, { match: 'ab', scope: 'string' }],
        },
        first: { rules: [{ match: 'a', scope: 'keyword' }] },
      },
    }
    // `a` is listed first, so it wins at the shared position even though `ab`
    // is the longer match.
    const tokens = tokenizeToArray('ab', compile(grammar))
    expect(tokens.map((t) => [t.text, t.scope])).toEqual([
      ['a', 'keyword'],
      ['b', null],
    ])
  })
})

describe('tokenize', () => {
  const grammar = compile(tiny)

  it('covers the input exactly', () => {
    const code = 'let x = 42 "a\\"b" tail'
    const tokens = tokenizeToArray(code, grammar)
    expect(tokens.map((t) => t.text).join('')).toBe(code)
  })

  it('reports ranges that agree with the text', () => {
    const code = 'let x = 42'
    for (const token of tokenizeToArray(code, grammar)) {
      expect(code.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('scopes capture groups positionally', () => {
    const tokens = tokenizeToArray('let count', grammar).filter((t) => t.scope)
    expect(tokens.map((t) => [t.text, t.scope])).toEqual([
      ['let', 'keyword'],
      ['count', 'variable'],
    ])
  })

  it('applies a state default to unmatched text', () => {
    const tokens = tokenizeToArray('"abc"', grammar)
    expect(tokens.map((t) => t.scope)).toEqual(['string', 'string', 'string'])
  })

  it('terminates on a rule that neither consumes nor changes state', () => {
    const spinner = compile({
      name: 'spin',
      states: { root: { rules: [{ match: '(?=a)', scope: 'keyword' }] } },
    })
    const tokens = tokenizeToArray('aaa', spinner)
    expect(tokens.map((t) => t.text).join('')).toBe('aaa')
  })

  it('never pops past the root state', () => {
    const popper = compile({
      name: 'pop',
      states: { root: { rules: [{ match: 'a', scope: 'keyword', pop: 5 }] } },
    })
    expect(tokenizeToArray('aaa', popper).length).toBe(3)
  })

  it('handles an empty input', () => {
    expect(tokenizeToArray('', grammar)).toEqual([])
  })

  it('does not emit a nested capture group twice', () => {
    // Positional scoping assumes sibling groups. A nested one starts behind the
    // cursor, and re-emitting it would repeat that text in the rendered output.
    const nested = compile({
      name: 'nested',
      states: {
        root: { rules: [{ match: '((a)b)c', scope: ['keyword', 'number'] }] },
      },
    })
    const tokens = tokenizeToArray('abc', nested)
    expect(tokens.map((t) => t.text).join('')).toBe('abc')
    expect(highlight('abc', nested)).toBe('<span class="shl-k">ab</span>c')
  })

  it('does not emit a group captured inside a lookahead twice', () => {
    const ahead = compile({
      name: 'ahead',
      states: {
        root: {
          rules: [{ match: '(?=(ab))(a)', scope: ['keyword', 'number'] }],
        },
      },
    })
    expect(
      tokenizeToArray('ab', ahead)
        .map((t) => t.text)
        .join(''),
    ).toBe('ab')
  })
})

describe('escapeHtml', () => {
  it('escapes the three characters that matter in element content', () => {
    expect(escapeHtml('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d')
  })

  it('returns the original string when there is nothing to escape', () => {
    const input = 'nothing to do here'
    expect(escapeHtml(input)).toBe(input)
  })

  it('leaves quotes alone', () => {
    expect(escapeHtml(`"'`)).toBe(`"'`)
  })
})

describe('highlight', () => {
  const grammar = compile(tiny)

  it('merges adjacent ranges that share a scope', () => {
    // Three string ranges (open quote, body, close quote) become one span.
    expect(highlight('"ab"', grammar)).toBe('<span class="shl-s">&quot;ab&quot;</span>'.replace(/&quot;/g, '"'))
  })

  it('writes unscoped text without a wrapper', () => {
    expect(highlight('   ', grammar)).toBe('   ')
  })

  it('escapes token text', () => {
    expect(highlight('"<script>"', grammar)).toMatch(/&lt;script&gt;/)
    expect(highlight('"<script>"', grammar)).not.toMatch(/<script>/i)
  })

  it('honours a custom class prefix', () => {
    expect(highlight('42', grammar, { classPrefix: 'hl-' })).toMatch(/class="hl-n"/)
  })

  it('wraps every line when asked', () => {
    const html = highlight('1\n2\n3', grammar, { lines: true })
    expect(html.match(/class="shl-line"/g)?.length).toBe(3)
  })

  it('does not emit a trailing empty line for a trailing newline', () => {
    const html = highlight('1\n2\n', grammar, { lines: true })
    expect(html.match(/class="shl-line"/g)?.length).toBe(2)
  })

  it('keeps blank lines as their own line elements', () => {
    const html = highlight('1\n\n3', grammar, { lines: true })
    expect(html.match(/class="shl-line"/g)?.length).toBe(3)
  })

  it('marks highlighted lines', () => {
    const html = highlight('1\n2\n3', grammar, {
      lines: true,
      highlightLines: [2],
    })
    expect(html.match(/data-hl/g)?.length).toBe(1)
    expect(html).toMatch(/<span class="shl-line" data-hl><span class="shl-n">2<\/span>\n<\/span>/)
  })

  it('preserves the source text through line splitting', () => {
    const code = 'let a = 1\n\n"two\nlines"\nlet b = 2'
    const html = highlight(code, grammar, { lines: true })
    // Stripping tags must give back the source exactly: that is what a user
    // gets when they select and copy the block.
    const text = textFromHtml(html)
    expect(text).toBe(code)
  })

  it('puts the newline inside the line element, not between elements', () => {
    // Between block elements a newline renders double-height; without one
    // anywhere, blank lines vanish from a copied selection.
    const html = highlight('1\n2\n3', grammar, { lines: true })
    // No newline sits between two line elements...
    expect(html).not.toMatch(/<\/span>\n<span class="shl-line"/)
    // ...but each line except the last (the source has no trailing newline)
    // closes with one inside its own element.
    expect(html).toMatch(/<span class="shl-n">1<\/span>\n<\/span><span class="shl-line">/)
    expect((html.match(/\n/g) ?? []).length).toBe(2)
  })

  it('keeps blank lines in the copyable text', () => {
    const html = highlight('a\n\nb\n', grammar, { lines: true })
    const text = textFromHtml(html)
    expect(text).toBe('a\n\nb\n')
  })
})

describe('highlightBlock', () => {
  const grammar = compile(tiny)

  it('emits a themeable pre/code pair', () => {
    expect(highlightBlock('42', grammar)).toMatch(/^<pre class="shl-code"><code>.*<\/code><\/pre>$/)
  })

  it('adds the gutter classes only when numbering', () => {
    expect(highlightBlock('42', grammar, { lineNumbers: true })).toMatch(
      /class="shl-code shl-code-lined shl-code-numbered"/,
    )
    expect(highlightBlock('42', grammar, { lines: true })).toMatch(/class="shl-code shl-code-lined"/)
  })

  it('exposes the language when asked', () => {
    expect(highlightBlock('42', grammar, { showLanguage: true })).toMatch(/data-lang="tiny"/)
  })

  it('sizes the gutter for the widest line number in the block', () => {
    // The gutter is one width for the whole block, so the code starts at the
    // same column on line 9 and line 10. Without this the counter overflows a
    // fixed-width box once a block passes 99 lines.
    const block = (lines: number): string => {
      const code = Array.from({ length: lines }, (_, i) => `${i}`).join('\n')
      return highlightBlock(code, grammar, { lineNumbers: true })
    }

    expect(block(9)).toContain('--shl-line-digits: 1')
    expect(block(10)).toContain('--shl-line-digits: 2')
    expect(block(99)).toContain('--shl-line-digits: 2')
    expect(block(100)).toContain('--shl-line-digits: 3')
    expect(block(1000)).toContain('--shl-line-digits: 4')
  })

  it('counts gutter digits from the lines it actually renders', () => {
    // A trailing newline closes the last line rather than opening an empty
    // one, so the count has to match the renderer rather than count newlines.
    const digitsOf = (code: string): string | undefined =>
      highlightBlock(code, grammar, { lineNumbers: true }).match(/--shl-line-digits: \d+/)?.[0]

    expect(digitsOf('')).toBe('--shl-line-digits: 1')
    expect(digitsOf('1\n')).toBe('--shl-line-digits: 1')
    expect(digitsOf(`${Array.from({ length: 10 }, (_, i) => i).join('\n')}\n`)).toBe('--shl-line-digits: 2')
  })

  it('sets no gutter variable when not numbering', () => {
    expect(highlightBlock('1\n2', grammar)).not.toContain('shl-line-digits')
    expect(highlightBlock('1\n2', grammar, { lines: true })).not.toContain('shl-line-digits')
  })

  it('escapes options that land in an attribute', () => {
    // These are interpolated into `class`, where an unescaped quote would close
    // the attribute and let the rest of the value become markup.
    const injected = '"><img src=x onerror=alert(1)>'
    for (const html of [
      highlightBlock('42', grammar, { className: injected }),
      highlightBlock('42', grammar, { classPrefix: injected }),
      highlight('42', grammar, { classPrefix: injected }),
      highlight('42', grammar, { classPrefix: injected, lines: true }),
    ]) {
      expect(html).not.toMatch(/<img/)
    }
  })
})

describe('scopeClass', () => {
  it('maps known scopes to their short class suffix', () => {
    expect(scopeClass('keyword')).toBe('k')
    expect(scopeClass('keyword.declaration')).toBe('kd')
  })

  it('slugifies an unknown scope rather than throwing', () => {
    expect(scopeClass('string.heredoc')).toBe('string-heredoc')
  })

  it('slugifies prototype-named scopes rather than resolving inherited members', () => {
    // A scope is data a grammar supplies, so `constructor` must not come back as
    // Object.prototype.constructor and stringify a function into the class.
    expect(scopeClass('constructor')).toBe('constructor')
    expect(scopeClass('toString')).toBe('toString')
    expect(scopeClass('__proto__')).toBe('-proto-')
  })
})

describe('registry', () => {
  it('resolves names and aliases case-insensitively', () => {
    registerLanguage(tiny)
    expect(resolveGrammar('TINY').name).toBe('tiny')
    expect(resolveGrammar('t').name).toBe('tiny')
  })

  it('returns the same compiled grammar on repeat lookups', () => {
    registerLanguage(tiny)
    expect(resolveGrammar('tiny')).toBe(resolveGrammar('t'))
  })

  it('throws on an unknown language rather than rendering it plain', () => {
    expect(() => resolveGrammar('klingon')).toThrow(/not registered/)
  })

  it('accepts an uncompiled grammar directly', () => {
    expect(resolveGrammar(tiny).name).toBe('tiny')
  })

  it('re-registering replaces the grammar under its aliases too', () => {
    const first: Grammar = {
      name: 'swap',
      aliases: ['sw'],
      states: { root: { rules: [{ match: 'a', scope: 'keyword' }] } },
    }
    const second: Grammar = {
      name: 'swap',
      aliases: ['sw'],
      states: { root: { rules: [{ match: 'a', scope: 'number' }] } },
    }

    registerLanguage(first)
    // Warm the cache under both names before replacing, then read the alias
    // first: evicting only the canonical name would leave this one stale.
    resolveGrammar('swap')
    registerLanguage(second)
    expect(highlight('a', resolveGrammar('sw'))).toMatch(/shl-n/)
    expect(resolveGrammar('sw')).toBe(resolveGrammar('swap'))
  })

  it('drops an alias the replacing grammar no longer claims', () => {
    registerLanguage({
      name: 'shrink',
      aliases: ['gone'],
      states: { root: { rules: [] } },
    })
    expect(resolveGrammar('gone').name).toBe('shrink')
    registerLanguage({ name: 'shrink', states: { root: { rules: [] } } })
    expect(() => resolveGrammar('gone')).toThrow(/not registered/)
  })
})
