import { describe, expect, it } from 'vitest'

import builtCss from '../dist/style.css?raw'

describe('dist', () => {
  it('does not include Vue deep selectors in built css', () => {
    expect(builtCss).not.toContain(':deep')
  })
})
