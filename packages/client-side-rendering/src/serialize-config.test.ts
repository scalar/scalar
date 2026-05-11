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
  it('returns a JSON-safe object literal when no functions are present', () => {
    expect(serializeConfigToScript({ url: '/a.json', theme: 'kepler' })).toBe(
      ['{', '        "url": "/a.json",', '        "theme": "kepler"', '      }'].join('\n'),
    )
  })

  it('inlines function-valued props as raw source', () => {
    const result = serializeConfigToScript({
      url: '/a.json',
      onLoaded: function namedHandler() {
        return 'hello'
      },
    })

    expect(result).toContain('"url": "/a.json"')
    expect(result).toContain('"onLoaded":')
    expect(result).toContain('namedHandler')
    expect(result).toMatch(/return ['"]hello['"]/)
  })

  it('preserves function entries inside arrays', () => {
    const plugin = function pluginFactory() {
      return { name: 'fn-plugin' }
    }

    const result = serializeConfigToScript({ plugins: ['plain', plugin] })

    expect(result).toContain('"plugins": ["plain", function pluginFactory')
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
    expect(result).not.toMatch(/^\{}$/)
  })

  it('drops `undefined` props from the JSON portion (matches JSON.stringify semantics)', () => {
    const result = serializeConfigToScript({ customCss: undefined, onLoaded: () => 1 })
    expect(result).not.toContain('customCss')
    expect(result).toContain('"onLoaded":')
  })

  it('escapes </script> in string values so it cannot terminate the inline script', () => {
    const result = serializeConfigToScript({ content: '</script><img src=x onerror=alert(1)>' })

    // Raw `</script` would close the surrounding <script> element. The escaped
    // `<\/script` is parsed as the same string by the JS engine but does not
    // match the HTML parser's end-tag scanner.
    expect(result).not.toContain('</script')
    expect(result).toContain('<\\/script')
  })

  it('escapes </script> inside function source', () => {
    const onLoaded = function leak() {
      // This source survives `Function#toString()` and would otherwise close
      // the surrounding inline script.
      return '</script><img src=x>'
    }

    const result = serializeConfigToScript({ onLoaded })

    expect(result).not.toContain('</script')
    expect(result).toContain('<\\/script')
  })

  it('escapes <!-- in user input', () => {
    const result = serializeConfigToScript({ content: 'a<!--b' })

    expect(result).not.toContain('<!--')
    expect(result).toContain('<\\!--')
  })
})
