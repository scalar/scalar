import { describe, expect, it } from 'vitest'

import { syntaxHighlight } from '../code/highlight'
import { standardLanguages } from './index'

/**
 * These tests cover the custom Mojo grammar, which extends the bundled
 * highlight.js Python grammar with Mojo keywords, types, and call-site
 * highlighting.
 */
describe('mojo', () => {
  const highlight = (code: string) => syntaxHighlight(code, { lang: 'mojo', languages: standardLanguages })

  it('highlights Mojo-specific declaration keywords', () => {
    const result = highlight('fn main():\n    var x = 1')

    expect(result).toContain('<span class="hljs-keyword">fn</span>')
    expect(result).toContain('<span class="hljs-keyword">var</span>')
  })

  it('highlights struct and trait declarations', () => {
    const result = highlight('struct Point:\n    pass\n\ntrait Drawable:\n    pass')

    expect(result).toContain('<span class="hljs-keyword">struct</span>')
    expect(result).toContain('<span class="hljs-keyword">trait</span>')
  })

  it('highlights argument-convention modifiers', () => {
    const result = highlight('fn take(owned value: String, inout other: Int):\n    pass')

    expect(result).toContain('<span class="hljs-keyword">owned</span>')
    expect(result).toContain('<span class="hljs-keyword">inout</span>')
  })

  it('highlights Mojo standard-library types', () => {
    const result = highlight('var total: Int = 0\nvar name: String = "scalar"')

    expect(result).toContain('<span class="hljs-type">Int</span>')
    expect(result).toContain('<span class="hljs-type">String</span>')
  })

  it('highlights call sites as function titles', () => {
    const result = highlight('var data = response.json()\nprocess(data)')

    expect(result).toContain('<span class="hljs-title function_">json</span>')
    expect(result).toContain('<span class="hljs-title function_">process</span>')
  })

  it('still highlights Python control-flow keywords', () => {
    const result = highlight('if x:\n    return y')

    expect(result).toContain('<span class="hljs-keyword">if</span>')
    expect(result).toContain('<span class="hljs-keyword">return</span>')
  })
})
