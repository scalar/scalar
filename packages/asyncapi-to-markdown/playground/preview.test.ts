import { describe, expect, it } from 'vitest'

import { renderPreview } from './preview'

describe('preview', () => {
  it('preserves generated destinations and code while removing executable authored HTML', () => {
    const html = renderPreview(
      '<a id="scalar-schema-order"></a>\n\n[Order](#scalar-schema-order)\n\n```json\n{"id": 1}\n```\n\n<script>alert(1)</script>\n\n[Bad](javascript:alert(1))',
    )
    expect(html).toContain('id="scalar-schema-order"')
    expect(html).toContain('href="#scalar-schema-order"')
    expect(html).toContain('<code class="language-json">{"id": 1}')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('href="javascript:')
  })
})
