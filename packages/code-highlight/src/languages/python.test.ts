import { toHtml } from 'hast-util-to-html'
import { createLowlight } from 'lowlight'
import { describe, expect, it } from 'vitest'

import python from './python'

/**
 * These tests cover the custom Python grammar that adds call-site highlighting
 * on top of the bundled highlight.js grammar (DOC-5618).
 *
 * Code blocks are highlighted with Shiki, but this grammar is still shipped and
 * used by the markdown pipeline, so it is unit-tested directly against lowlight.
 */
describe('python', () => {
  const lowlight = createLowlight({ python })
  const highlight = (code: string) => toHtml(lowlight.highlight('python', code))

  it('highlights method and function call sites as function titles', () => {
    const result = highlight('conn.request("POST", "/users")\nres.getresponse()')

    expect(result).toContain('<span class="hljs-title function_">request</span>')
    expect(result).toContain('<span class="hljs-title function_">getresponse</span>')
  })

  it('keeps reserved keywords coloured as keywords', () => {
    const result = highlight('if x:\n    return foo')

    expect(result).toContain('<span class="hljs-keyword">if</span>')
    expect(result).toContain('<span class="hljs-keyword">return</span>')
  })

  it('does not treat keywords followed by parentheses as function calls', () => {
    const result = highlight('if (x):\n    pass')

    // `if` must remain a keyword even though a parenthesis follows it
    expect(result).toContain('<span class="hljs-keyword">if</span>')
    expect(result).not.toContain('<span class="hljs-title function_">if</span>')
  })

  it('keeps built-ins coloured as built-ins rather than function titles', () => {
    const result = highlight('print(data)\nrange(10)')

    expect(result).toContain('<span class="hljs-built_in">print</span>')
    expect(result).toContain('<span class="hljs-built_in">range</span>')
    expect(result).not.toContain('<span class="hljs-title function_">print</span>')
  })

  it('still highlights function and class definitions', () => {
    const result = highlight('def get_user(id):\n    pass\n\nclass User:\n    pass')

    expect(result).toContain('<span class="hljs-keyword">def</span>')
    expect(result).toContain('<span class="hljs-title function_">get_user</span>')
    expect(result).toContain('<span class="hljs-keyword">class</span>')
    expect(result).toContain('<span class="hljs-title class_">User</span>')
  })

  it('highlights chained method calls in a realistic request snippet', () => {
    const result = highlight('response = requests.get(url)\ndata = response.json()')

    expect(result).toContain('<span class="hljs-title function_">get</span>')
    expect(result).toContain('<span class="hljs-title function_">json</span>')
  })
})
