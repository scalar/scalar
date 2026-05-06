import { describe, expect, it } from 'vitest'

import { serializeClientConfig } from './serialize-client-config'

describe('serializeClientConfig', () => {
  it('writes JSON-safe config as a JSON object literal', () => {
    const script = serializeClientConfig({
      key: 'mount-1',
      configuration: { url: '/a.json', theme: 'default' },
      cdn: null,
    })

    expect(script).toContain('"mount-1"')
    expect(script).toContain('configuration:{"url":"/a.json","theme":"default"}')
    expect(script).toContain('cdn:null')
  })

  it('inlines top-level function-valued props as raw source', () => {
    const onLoaded = function namedHandler() {
      return 'hello'
    }
    const script = serializeClientConfig({
      key: 'mount-1',
      configuration: { url: '/a.json', onLoaded },
      cdn: null,
    })

    expect(script).toContain('"url":"/a.json"')
    // The raw function source is present, not stripped to undefined like JSON.stringify would.
    expect(script).toContain('"onLoaded":')
    expect(script).toContain('namedHandler')
    expect(script).toMatch(/return ['"]hello['"]/)
  })

  it('inlines arrays containing function entries', () => {
    const plugin = function pluginFactory() {
      return { name: 'fn-plugin' }
    }
    const script = serializeClientConfig({
      key: 'mount-1',
      configuration: {
        plugins: ['plain', plugin],
      },
      cdn: null,
    })

    expect(script).toContain('"plugins": ["plain", function pluginFactory')
  })

  it('emits a config object when every prop is a function', () => {
    const script = serializeClientConfig({
      key: 'mount-1',
      configuration: { onLoaded: function namedHandler() {} },
      cdn: null,
    })

    // Should not produce `{}` and then drop the function — the object literal
    // must contain the function entry.
    expect(script).toContain('configuration:{ "onLoaded":')
    expect(script).toContain('namedHandler')
    expect(script).not.toContain('configuration:{}')
  })

  it('escapes </script> in string config values so it cannot break out of the script tag', () => {
    const script = serializeClientConfig({
      key: 'mount-1',
      configuration: { content: '</script><img src=x onerror=alert(1)>' },
      cdn: null,
    })

    // The escaped `<\/script` is parsed as the same string by the JS engine
    // but does not match the HTML parser's end-tag scanner.
    expect(script).not.toContain('</script')
    expect(script).toContain('<\\/script')
  })

  it('escapes </script> in function source', () => {
    const script = serializeClientConfig({
      key: 'mount-1',
      configuration: {
        onLoaded: function leak() {
          return '</script>'
        },
      },
      cdn: null,
    })

    expect(script).not.toContain('</script')
    expect(script).toContain('<\\/script')
  })

  it('escapes </script> in the cdn URL', () => {
    const script = serializeClientConfig({
      key: 'mount-1',
      configuration: {},
      cdn: 'https://evil.example.com/</script><img src=x>',
    })

    expect(script).not.toContain('</script')
    expect(script).toContain('<\\/script')
  })

  it('round-trips the cdn value via JSON', () => {
    const script = serializeClientConfig({
      key: 'mount-1',
      configuration: {},
      cdn: 'https://example.com/scalar.js',
    })

    expect(script).toContain('cdn:"https://example.com/scalar.js"')
  })

  it('keys entries by the provided id', () => {
    const a = serializeClientConfig({ key: 'a', configuration: {}, cdn: null })
    const b = serializeClientConfig({ key: 'b-with-dashes', configuration: {}, cdn: null })

    expect(a).toContain('configs["a"]')
    expect(b).toContain('configs["b-with-dashes"]')
  })

  it('initializes the registry idempotently', () => {
    const script = serializeClientConfig({ key: 'a', configuration: {}, cdn: null })

    // Uses `||` so a second emission does not clobber the existing registry.
    expect(script).toContain('window.__scalarAstro=window.__scalarAstro||{configs:{}}')
  })
})
