import hljs from 'highlight.js/lib/core'
import { describe, expect, it } from 'vitest'

import python from './python'

hljs.registerLanguage('python', python)

/** Highlight a Python snippet with the extended grammar. */
const highlight = (code: string) => hljs.highlight(code, { language: 'python' }).value

describe('python', () => {
  it('highlights function and method calls as function titles', () => {
    const result = highlight('Profound(api_key="")')

    expect(result).toContain('<span class="hljs-title function_">Profound</span>')
  })

  it('highlights chained method calls', () => {
    const result = highlight('client.reports.visibility.query()')

    expect(result).toContain('<span class="hljs-title function_">query</span>')
  })

  it('highlights keyword arguments and assignment targets as attributes', () => {
    const result = highlight('visibility = client.query(date_interval="day")')

    expect(result).toContain('<span class="hljs-attr">visibility</span>')
    expect(result).toContain('<span class="hljs-attr">date_interval</span>')
  })

  it('does not treat control-flow keywords as function calls', () => {
    const result = highlight('if (value):\n    return None')

    expect(result).toContain('<span class="hljs-keyword">if</span>')
    expect(result).not.toContain('<span class="hljs-title function_">if</span>')
  })

  it('does not treat comparisons as assignments', () => {
    const result = highlight('while x == 0 and y != 1:\n    pass')

    expect(result).not.toContain('<span class="hljs-attr">x</span>')
    expect(result).not.toContain('<span class="hljs-attr">y</span>')
  })

  it('does not highlight tokens inside strings or comments', () => {
    const result = highlight('text = "key=value call(x)"  # other=thing call(y)')

    expect(result).not.toContain('<span class="hljs-attr">key</span>')
    expect(result).not.toContain('<span class="hljs-title function_">call</span>')
  })

  it('keeps identifiers that merely start with a reserved word', () => {
    const result = highlight('importlib.reload(module)')

    expect(result).toContain('<span class="hljs-title function_">reload</span>')
  })

  it('keeps built-in functions and the def keyword intact', () => {
    const result = highlight('def add(a, b):\n    return print(a)')

    expect(result).toContain('<span class="hljs-keyword">def</span>')
    expect(result).toContain('<span class="hljs-title function_">add</span>')
    expect(result).toContain('<span class="hljs-built_in">print</span>')
  })
})
