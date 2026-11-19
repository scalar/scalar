import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import ThemeStyle from './ThemeStyle.vue'

/** Mounts the component into the document, so the browser parses what it renders. */
const render = (props: { css: string; slug: string }): HTMLElement => {
  const host = document.createElement('div')
  document.body.append(host)
  mount(ThemeStyle, { props, attachTo: host })
  return host
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ThemeStyle', () => {
  it('renders the theme CSS in a style element', () => {
    const host = render({ css: ':root { --scalar-color-1: red; }', slug: 'purple' })

    const style = host.querySelector('style')
    expect(style?.id).toBe('scalar-theme')
    expect(style?.dataset.testid).toBe('purple')
    expect(style?.textContent).toContain('--scalar-color-1: red')
  })

  it('keeps CSS that contains a closing style tag inside a single style element', () => {
    const css = ':root { --a: 1; }</style><img src="x" data-injected><STYLE>.b { color: red }</StYlE ><b data-injected>'

    const host = render({ css, slug: 'custom' })

    expect(host.querySelectorAll('style')).toHaveLength(1)
    expect(host.querySelectorAll('[data-injected]')).toHaveLength(0)
    expect(host.querySelector('style')?.textContent).toContain('--a: 1')
  })

  it('keeps the CSS in a single style element when the markup is serialized and parsed again', () => {
    const css = ':root { --a: 1; }</style><img src="x" data-injected>'

    const host = render({ css, slug: 'custom' })
    const reparsed = new DOMParser().parseFromString(host.innerHTML, 'text/html')

    expect(reparsed.querySelectorAll('style')).toHaveLength(1)
    expect(reparsed.querySelectorAll('[data-injected]')).toHaveLength(0)
  })

  it('binds the slug as an attribute value', () => {
    const slug = 'custom" data-injected="1'

    const host = render({ css: '', slug })

    const style = host.querySelector('style')
    expect(style?.getAttribute('data-testid')).toBe(slug)
    expect(style?.hasAttribute('data-injected')).toBe(false)
  })
})
