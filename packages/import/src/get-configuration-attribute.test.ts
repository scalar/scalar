import { describe, expect, it } from 'vitest'

import { getConfigurationAttribute } from './resolve'

describe('getConfigurationAttribute', () => {
  it('returns the configuration attribute with double quotes', () => {
    const html = `<script id="api-reference" data-configuration="{&quot;spec&quot;:{&quot;content&quot;:&quot;foo&quot;}}"></script>`
    const result = getConfigurationAttribute(html)
    expect(result).toBe('{&quot;spec&quot;:{&quot;content&quot;:&quot;foo&quot;}}')
  })

  it('returns the configuration attribute with single quotes', () => {
    const html = `<script id='api-reference' data-configuration='{&quot;spec&quot;:{&quot;content&quot;:&quot;foo&quot;}}'></script>`
    const result = getConfigurationAttribute(html)
    expect(result).toBe('{&quot;spec&quot;:{&quot;content&quot;:&quot;foo&quot;}}')
  })

  it('returns undefined if no configuration attribute is present', () => {
    const html = `<script id="api-reference"></script>`
    const result = getConfigurationAttribute(html)
    expect(result).toBeUndefined()
  })

  it('returns undefined for non-matching script tags', () => {
    const html = `<script data-other-attribute="value" data-configuration="{&quot;spec&quot;:{&quot;content&quot;:&quot;foo&quot;}}"></script>`
    const result = getConfigurationAttribute(html)
    expect(result).toBeUndefined()
  })

  it('handles multiple script tags and returns the first match', () => {
    const html = `
      <script id="api-reference" data-configuration="{&quot;spec&quot;:{&quot;content&quot;:&quot;first&quot;}}"></script>
      <script id="api-reference" data-configuration="{&quot;spec&quot;:{&quot;content&quot;:&quot;second&quot;}}"></script>
    `
    const result = getConfigurationAttribute(html)
    expect(result).toBe('{&quot;spec&quot;:{&quot;content&quot;:&quot;first&quot;}}')
  })
})
