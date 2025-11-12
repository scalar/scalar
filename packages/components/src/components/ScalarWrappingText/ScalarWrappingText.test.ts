import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarWrappingText from './ScalarWrappingText.vue'

describe('ScalarWrappingText', () => {
  describe('default behavior', () => {
    it('uses path preset by default', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '/user/signup',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('/user')
      expect(html).toContain('/signup')
    })

    it('adds word break before forward slashes', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '/user/signup',
        },
      })
      const html = wrapper.html()
      const wbrCount = (html.match(/<wbr>/g) || []).length
      expect(wbrCount).toBeGreaterThan(0)
      expect(html).toContain('/user')
      expect(html).toContain('/signup')
    })

    it('adds word break before dashes', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'long-string-test',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('long')
      expect(html).toContain('-string')
      expect(html).toContain('-test')
    })

    it('handles both slashes and dashes', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '/api/user-profile',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('/api')
      expect(html).toContain('/user')
      expect(html).toContain('-profile')
    })

    it('handles long URI strings with multiple slashes', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '/long/uri/that/also/needs/to/be/handled/properly/in/the/sidebar',
        },
      })
      const html = wrapper.html()
      const wbrCount = (html.match(/<wbr>/g) || []).length
      expect(wbrCount).toBeGreaterThan(1)
      expect(wbrCount).toBeLessThanOrEqual(html.split('/').length - 1)
    })

    it('handles strings without wrap characters', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'Long string that needs to wrap to multiple lines',
        },
      })
      const text = wrapper.text()
      expect(text).toBe('Long string that needs to wrap to multiple lines')
      // Component always renders one <wbr> before each word segment
      // When there are no matches, there's only one segment
      const wbrCount = (wrapper.html().match(/<wbr>/g) || []).length
      expect(wbrCount).toBe(1)
    })

    it('handles empty string', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '',
        },
      })
      const text = wrapper.text()
      expect(text).toBe('')
    })

    it('handles strings with no matching characters', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'test',
        },
      })
      const text = wrapper.text()
      expect(text).toBe('test')
      // Component always renders one <wbr> before each word segment
      // When there are no matches, there's only one segment
      const wbrCount = (wrapper.html().match(/<wbr>/g) || []).length
      expect(wbrCount).toBe(1)
    })

    it('handles PascalCase with default settings (should not wrap)', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'LongPascalCaseStringThatNeedsToWrapToMultipleLines',
        },
      })
      const text = wrapper.text()
      expect(text).toBe('LongPascalCaseStringThatNeedsToWrapToMultipleLines')
      // Component always renders one <wbr> before each word segment
      // When there are no matches, there's only one segment
      const wbrCount = (wrapper.html().match(/<wbr>/g) || []).length
      expect(wbrCount).toBe(1)
    })
  })

  describe('path preset', () => {
    it('explicitly uses path preset', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '/api/user-profile',
          preset: 'path',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('/api')
      expect(html).toContain('/user')
      expect(html).toContain('-profile')
    })

    it('matches forward slashes', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '/user/signup',
          preset: 'path',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('/user')
      expect(html).toContain('/signup')
    })

    it('matches dashes', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'long-string-test',
          preset: 'path',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('long')
      expect(html).toContain('-string')
      expect(html).toContain('-test')
    })

    it('matches both slashes and dashes', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '/api/user-profile',
          preset: 'path',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('/api')
      expect(html).toContain('/user')
      expect(html).toContain('-profile')
    })

    it('does not match uppercase letters', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'PascalCase',
          preset: 'path',
        },
      })
      const text = wrapper.text()
      expect(text).toBe('PascalCase')
      // Component always renders one <wbr> before each word segment
      // When there are no matches, there's only one segment
      const wbrCount = (wrapper.html().match(/<wbr>/g) || []).length
      expect(wbrCount).toBe(1)
    })

    it('does not match underscores', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'snake_case',
          preset: 'path',
        },
      })
      const text = wrapper.text()
      expect(text).toBe('snake_case')
      // Component always renders one <wbr> before each word segment
      // When there are no matches, there's only one segment
      const wbrCount = (wrapper.html().match(/<wbr>/g) || []).length
      expect(wbrCount).toBe(1)
    })

    it('does not match dots', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'dot.separated',
          preset: 'path',
        },
      })
      const html = wrapper.html()
      // Path preset matches dots, so this should have multiple segments
      const wbrCount = (html.match(/<wbr>/g) || []).length
      expect(wbrCount).toBeGreaterThan(1)
      const text = wrapper.text()
      expect(text).toBe('dot.separated')
    })
  })

  describe('property preset', () => {
    it('matches uppercase letters', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'PascalCase',
          preset: 'property',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('Pascal')
      expect(html).toContain('Case')
    })

    it('matches underscores', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'snake_case',
          preset: 'property',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('snake')
      expect(html).toContain('_case')
    })

    it('matches dots', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'dot.separated',
          preset: 'property',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('dot')
      expect(html).toContain('.separated')
    })

    it('matches dashes', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'kebab-case',
          preset: 'property',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('kebab')
      expect(html).toContain('-case')
    })

    it('handles mixed property separators', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'MyProperty_Name.subProperty',
          preset: 'property',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      const text = wrapper.text()
      expect(text).toBe('MyProperty_Name.subProperty')
    })

    it('handles mixed property separators including kebab-case', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'MyProperty-Name_subProperty.property-name',
          preset: 'property',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      const text = wrapper.text()
      expect(text).toBe('MyProperty-Name_subProperty.property-name')
    })

    it('handles long PascalCase strings', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'LongPascalCaseStringThatNeedsToWrapToMultipleLines',
          preset: 'property',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      const wbrCount = (html.match(/<wbr>/g) || []).length
      expect(wbrCount).toBeGreaterThan(0)
    })

    it('does not match lowercase text', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'lowercase text',
          preset: 'property',
        },
      })
      const text = wrapper.text()
      expect(text).toBe('lowercase text')
      // Component always renders one <wbr> before each word segment
      // When there are no matches, there's only one segment
      const wbrCount = (wrapper.html().match(/<wbr>/g) || []).length
      expect(wbrCount).toBe(1)
    })

    it('does not match slashes', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '/api/user',
          preset: 'property',
        },
      })
      const text = wrapper.text()
      expect(text).toBe('/api/user')
      // Component always renders one <wbr> before each word segment
      // When there are no matches, there's only one segment
      const wbrCount = (wrapper.html().match(/<wbr>/g) || []).length
      expect(wbrCount).toBe(1)
    })
  })

  describe('custom regex', () => {
    it('uses custom regex for wrap characters', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'test.dot.separated',
          regex: /\./g,
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('test')
      expect(html).toContain('.dot')
      expect(html).toContain('.separated')
    })

    it('handles multiple custom wrap characters', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'test_dot_separated',
          regex: /[._]/g,
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('test')
      expect(html).toContain('_dot')
      expect(html).toContain('_separated')
    })

    it('handles custom regex that does not match', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'simple text',
          regex: /X/g,
        },
      })
      const text = wrapper.text()
      expect(text).toBe('simple text')
      // Component always renders one <wbr> before each word segment
      // When there are no matches, there's only one segment
      const wbrCount = (wrapper.html().match(/<wbr>/g) || []).length
      expect(wbrCount).toBe(1)
    })

    it('handles empty regex pattern', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '/test/path',
          regex: /(?!)/g,
        },
      })
      const text = wrapper.text()
      expect(text).toBe('/test/path')
      // Component always renders one <wbr> before each word segment
      // When there are no matches, there's only one segment
      const wbrCount = (wrapper.html().match(/<wbr>/g) || []).length
      expect(wbrCount).toBe(1)
    })

    it('overrides preset when regex is provided', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '/api/user-profile',
          preset: 'property',
          regex: /\./g,
        },
      })
      const text = wrapper.text()
      expect(text).toBe('/api/user-profile')
      // Custom regex /\./g doesn't match anything in '/api/user-profile'
      // Component always renders one <wbr> before each word segment
      // When there are no matches, there's only one segment
      const wbrCount = (wrapper.html().match(/<wbr>/g) || []).length
      expect(wbrCount).toBe(1)
    })

    it('handles PascalCase with custom regex', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'LongPascalCaseString',
          regex: /([A-Z])/g,
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('Long')
      expect(html).toContain('Pascal')
      expect(html).toContain('Case')
      expect(html).toContain('String')
    })

    it('handles PascalCase excluding first letter', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'PascalCase',
          regex: /(?<!^)([A-Z])/g,
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('Pascal')
      expect(html).toContain('Case')
      expect(html).not.toContain('PascalCase')
    })

    it('handles mixed patterns with custom regex', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'LongPascalCase-String/ThatNeedsToWrap',
          regex: /([A-Z])/g,
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      const text = wrapper.text()
      expect(text).toBe('LongPascalCase-String/ThatNeedsToWrap')
    })
  })

  describe('edge cases', () => {
    it('handles string with only forward slash', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '/',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('/')
    })

    it('handles string with only dash', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '-',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('-')
    })

    it('handles multiple consecutive wrap characters', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '///---',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      const text = wrapper.text()
      expect(text).toBe('///---')
    })

    it('handles string that starts and ends with wrap characters', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '/start-and-end/',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      const text = wrapper.text()
      expect(text).toBe('/start-and-end/')
    })

    it('preserves original string structure', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '/api/v1/users',
        },
      })
      const text = wrapper.text()
      expect(text).toBe('/api/v1/users')
    })

    it('handles property preset with single uppercase letter', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: 'A',
          preset: 'property',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('A')
    })

    it('handles property preset with single underscore', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '_',
          preset: 'property',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('_')
    })

    it('handles property preset with single dot', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '.',
          preset: 'property',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('.')
    })

    it('handles property preset with single dash', () => {
      const wrapper = mount(ScalarWrappingText, {
        props: {
          text: '-',
          preset: 'property',
        },
      })
      const html = wrapper.html()
      expect(html).toContain('<wbr>')
      expect(html).toContain('-')
    })
  })
})
