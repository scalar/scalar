import { describe, expect, it } from 'vitest'

import { registerLanguage, tokenize } from '../index'
import javascript from './javascript'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order.
registerLanguage(javascript)

/** Tokens as the renderer sees them: adjacent ranges sharing a scope are one run. */
const runs = (code: string): [string, string | null][] => {
  const out: [string, string | null][] = []
  for (const token of tokenize(code, 'javascript')) {
    const last = out[out.length - 1]
    if (last && last[1] === token.scope) {
      last[0] += token.text
    } else {
      out.push([token.text, token.scope])
    }
  }
  return out
}

/** The scope carried by the first run whose text is exactly `text`, or null. */
const scopeOf = (code: string, text: string): string | null | undefined => runs(code).find((r) => r[0] === text)?.[1]

describe('javascript', () => {
  describe('function names', () => {
    it('scopes a function declaration', () => {
      expect(scopeOf('function greet() {}', 'greet')).toBe('function.call')
    })

    it('scopes a name bound to an arrow function', () => {
      expect(scopeOf('const compare = (a, b) => a !== b', 'compare')).toBe('function')
    })

    it('scopes a name bound to a single-parameter arrow function', () => {
      expect(scopeOf('const identity = x => x', 'identity')).toBe('function')
    })

    it('scopes a name bound to a function expression', () => {
      expect(scopeOf('const greet = function () {}', 'greet')).toBe('function')
    })

    it('scopes a name bound to an async arrow function', () => {
      expect(scopeOf('const load = async () => {}', 'load')).toBe('function')
    })

    it('leaves a name bound to a plain value unscoped as a function', () => {
      expect(scopeOf('const total = width * 2', 'total')).not.toBe('function')
    })

    it('leaves a destructuring binding alone', () => {
      expect(scopeOf('const [isOpen, setIsOpen] = useState(false)', 'isOpen')).not.toBe('function')
    })
  })

  describe('calls versus comparisons', () => {
    it('scopes a call', () => {
      expect(scopeOf('doThing()', 'doThing')).toBe('function.call')
    })

    it('scopes a call with a generic argument list', () => {
      expect(scopeOf('useState<number>(0)', 'useState')).toBe('function.call')
    })

    // `<` used to be enough on its own to read as the start of a generic call,
    // so every one of these painted a plain identifier as a function name.
    it('does not treat a less-than comparison as a call', () => {
      expect(scopeOf('if (count <= max) {}', 'count')).not.toBe('function.call')
    })

    it('does not treat a comparison inside an arrow body as a call', () => {
      expect(scopeOf('const f = (a, b) => b <= 10', 'b')).not.toBe('function.call')
    })

    it('does not treat JSX text as a call', () => {
      expect(scopeOf('<button>hi</button>', 'hi')).not.toBe('function.call')
    })

    it('does not treat a generic type annotation without a call as a call', () => {
      expect(scopeOf('let items: Array<string> = []', 'items')).not.toBe('function.call')
    })
  })

  describe('jsx', () => {
    it('leaves element text unscoped', () => {
      expect(runs('<button>Click me to open the Api Client</button>')).toContainEqual([
        'Click me to open the Api Client',
        null,
      ])
    })

    it('scopes a closing tag', () => {
      expect(runs('<button>hi</button>')).toEqual([
        ['<', 'punctuation.bracket'],
        ['button', 'tag'],
        ['>', 'punctuation.bracket'],
        ['hi', null],
        ['</', 'punctuation.bracket'],
        ['button', 'tag'],
        ['>', 'punctuation.bracket'],
      ])
    })

    it('scopes a fragment', () => {
      expect(runs('<>hi</>')).toEqual([
        ['<>', 'punctuation.bracket'],
        ['hi', null],
        ['</>', 'punctuation.bracket'],
      ])
    })

    it('scopes a self-closing element', () => {
      expect(scopeOf('<ApiClientReact />', 'ApiClientReact')).toBe('tag')
    })

    it('reads an interpolation in element text as an expression again', () => {
      expect(scopeOf('<p>{format(count)}</p>', 'format')).toBe('function.call')
      expect(scopeOf('<p>{format(count)}</p>', '{')).toBe('interpolation')
    })

    it('keeps nesting straight', () => {
      // The inner `</span>` closes the span, so `tail` is still element text
      // rather than an expression that ran on past the end of the markup.
      expect(runs('<div><span>head</span>tail</div>')).toContainEqual(['tail', null])
    })

    it('leaves a capitalised word after an element unscoped', () => {
      // Nothing here should still be inside the element once it has closed.
      expect(scopeOf('const x = <b>hi</b>\nconst Total = 1', 'Total')).toBe('type')
    })
  })
})
