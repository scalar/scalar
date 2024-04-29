import { describe, expect, it } from 'vitest'

import { getThemeById } from './'

describe('Get Theme by ID', () => {
  it('Should provide the default theme if no ThemeId is provided', () => {
    const res = getThemeById()
    expect(res).toMatchFileSnapshot('./presets/default.css')
  })

  it('Should provide no theme if "none" is provided', () => {
    const res = getThemeById('none')
    expect(res).toBe('')
  })

  it("Shouldn't add a layer by default", () => {
    const res = getThemeById('default')
    expect(res).not.toMatch(/^@layer/)
  })

  it('Should add a layer via config', () => {
    const res = getThemeById('default', { layer: 'my-layer' })
    expect(res).toMatch(/^@layer my-layer/)
  })
})
