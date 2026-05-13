import { describe, expect, it } from 'vitest'

import { escapeForInlineScript, serializeConfigToScript } from './serialize-config'

describe('escapeForInlineScript', () => {
  it('escapes lowercase </script>', () => {
    expect(escapeForInlineScript('a</script>b')).toBe('a<\\/script>b')
  })

  it('escapes uppercase or mixed-case </script>', () => {
    expect(escapeForInlineScript('a</SCRIPT>b')).toBe('a<\\/SCRIPT>b')
    expect(escapeForInlineScript('a</ScRiPt>b')).toBe('a<\\/ScRiPt>b')
  })

  it('escapes <!-- so it cannot start an HTML comment', () => {
    expect(escapeForInlineScript('a<!--b')).toBe('a<\\!--b')
  })

  it('leaves other content untouched', () => {
    expect(escapeForInlineScript('regular text < > / \\')).toBe('regular text < > / \\')
  })

  it('is idempotent — escaping an already-escaped value does nothing', () => {
    const once = escapeForInlineScript('</script><!--')
    expect(escapeForInlineScript(once)).toBe(once)
  })
})

describe('serializeConfigToScript', () => {
  it('serializes plain values as a valid JS object literal', () => {
    const result = serializeConfigToScript({ url: '/a.json', theme: 'kepler' })

    // serialize-javascript escapes `<`, `>`, and `/` as unicode escapes; the
    // JS engine decodes them back to the original characters at runtime.
    expect(result).toMatch(/"url":\s*"\\u002Fa\.json"/)
    expect(result).toMatch(/"theme":\s*"kepler"/)
  })

  it('inlines function-valued props as raw source', () => {
    const result = serializeConfigToScript({
      url: '/a.json',
      onLoaded: function namedHandler() {
        return 'hello'
      },
    })

    expect(result).toContain('"onLoaded":')
    expect(result).toContain('namedHandler')
    expect(result).toMatch(/return ['"]hello['"]/)
  })

  it('preserves function entries inside arrays', () => {
    const plugin = function pluginFactory() {
      return { name: 'fn-plugin' }
    }

    const result = serializeConfigToScript({ plugins: ['plain', plugin] })

    expect(result).toContain('"plugins":')
    expect(result).toContain('"plain"')
    expect(result).toContain('function pluginFactory')
  })

  it('emits a valid object literal when every prop is a function', () => {
    const result = serializeConfigToScript({
      onLoaded: function namedHandler() {
        return null
      },
    })

    expect(result).toContain('"onLoaded":')
    expect(result).toContain('namedHandler')
    expect(result).not.toContain('{,')
  })

  it('escapes </script> in string values so it cannot terminate the inline script', () => {
    const result = serializeConfigToScript({ content: '</script><img src=x onerror=alert(1)>' })

    // The HTML parser scans for a literal `</script` (case-insensitive). Any
    // escape form (`</`, `<\/`) breaks the match while the JS engine
    // still decodes back to the original string.
    expect(result).not.toMatch(/<\/script/i)
  })

  it('escapes </script> inside function source', () => {
    const onLoaded = function leak() {
      // This source survives `Function#toString()` and would otherwise close
      // the surrounding inline script.
      return '</script><img src=x>'
    }

    const result = serializeConfigToScript({ onLoaded })

    expect(result).not.toMatch(/<\/script/i)
  })

  it('escapes <!-- in user input', () => {
    const result = serializeConfigToScript({ content: 'a<!--b' })

    expect(result).not.toContain('<!--')
  })
})
