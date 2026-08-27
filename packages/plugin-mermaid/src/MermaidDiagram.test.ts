import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import MermaidDiagram from './MermaidDiagram.vue'

// `mermaid` is dynamically imported inside the component; mock it so the tests exercise the
// component's own logic (guarding, theming, latest-render-wins, cleanup) without loading the real,
// heavy library or rendering actual diagrams.
const mermaid = vi.hoisted(() => ({ initialize: vi.fn(), render: vi.fn() }))
vi.mock('mermaid', () => ({ default: mermaid }))

// A controllable color mode so the theming and re-render-on-change behaviour can be driven directly.
const colorMode = vi.hoisted(() => ({ isDarkMode: { value: false } }))
vi.mock('@scalar/use-hooks/useColorMode', () => ({
  useColorMode: () => ({ isDarkMode: colorMode.isDarkMode }),
}))

describe('MermaidDiagram', () => {
  beforeEach(() => {
    mermaid.initialize.mockClear()
    mermaid.render.mockReset()
    mermaid.render.mockResolvedValue({ svg: '<svg data-testid="diagram"></svg>' })
    colorMode.isDarkMode = ref(false)
  })

  it('renders the SVG returned by mermaid', async () => {
    const wrapper = mount(MermaidDiagram, { props: { xMermaid: 'graph TD; A-->B' } })
    await flushPromises()

    expect(mermaid.render).toHaveBeenCalledTimes(1)
    expect(mermaid.render).toHaveBeenCalledWith(expect.any(String), 'graph TD; A-->B')
    expect(wrapper.find('.scalar-mermaid-diagram').exists()).toBe(true)
    expect(wrapper.html()).toContain('data-testid="diagram"')
    expect(wrapper.find('.scalar-mermaid-diagram-error').exists()).toBe(false)
  })

  it('does not touch mermaid when the value is not a non-empty string', async () => {
    const wrapper = mount(MermaidDiagram, { props: { xMermaid: 42 } })
    await flushPromises()

    expect(mermaid.render).not.toHaveBeenCalled()
    expect(wrapper.find('.scalar-mermaid-diagram').exists()).toBe(false)
    expect(wrapper.find('.scalar-mermaid-diagram-error').exists()).toBe(false)
  })

  it('ignores whitespace-only sources', async () => {
    mount(MermaidDiagram, { props: { xMermaid: '   \n  ' } })
    await flushPromises()

    expect(mermaid.render).not.toHaveBeenCalled()
  })

  it('shows the error message once when mermaid throws', async () => {
    mermaid.render.mockRejectedValue(new Error('Parse error on line 2'))
    const wrapper = mount(MermaidDiagram, { props: { xMermaid: 'not a diagram' } })
    await flushPromises()

    const error = wrapper.find('.scalar-mermaid-diagram-error')
    expect(error.exists()).toBe(true)
    expect(error.text()).toContain('Failed to render Mermaid diagram: Parse error on line 2')
    // The prefix must appear exactly once — the reason should not repeat the sentence.
    expect(error.text().match(/Failed to render Mermaid diagram:/g)).toHaveLength(1)
    expect(wrapper.find('.scalar-mermaid-diagram').exists()).toBe(false)
  })

  it('falls back to a generic reason for non-Error throws', async () => {
    mermaid.render.mockRejectedValue('boom')
    const wrapper = mount(MermaidDiagram, { props: { xMermaid: 'not a diagram' } })
    await flushPromises()

    expect(wrapper.find('.scalar-mermaid-diagram-error').text()).toBe(
      'Failed to render Mermaid diagram: Unknown error.',
    )
  })

  it('initializes mermaid with the light theme by default and re-renders in dark mode', async () => {
    mount(MermaidDiagram, { props: { xMermaid: 'graph TD; A-->B' } })
    await flushPromises()
    expect(mermaid.initialize).toHaveBeenLastCalledWith(
      expect.objectContaining({ theme: 'default', securityLevel: 'strict' }),
    )

    colorMode.isDarkMode.value = true
    await flushPromises()
    expect(mermaid.render).toHaveBeenCalledTimes(2)
    expect(mermaid.initialize).toHaveBeenLastCalledWith(expect.objectContaining({ theme: 'dark' }))
  })

  it('re-renders when the source changes', async () => {
    const wrapper = mount(MermaidDiagram, { props: { xMermaid: 'graph TD; A-->B' } })
    await flushPromises()
    expect(mermaid.render).toHaveBeenCalledTimes(1)

    await wrapper.setProps({ xMermaid: 'graph TD; B-->C' })
    await flushPromises()
    expect(mermaid.render).toHaveBeenCalledTimes(2)
    expect(mermaid.render).toHaveBeenLastCalledWith(expect.any(String), 'graph TD; B-->C')
  })

  it('shows the newest render and ignores a slower earlier one', async () => {
    // Hold every render open so their resolution order can be controlled explicitly.
    const pending: Array<{ source: string; resolve: (svg: string) => void }> = []
    mermaid.render.mockImplementation(
      (_id: string, source: string) =>
        new Promise((resolve) => pending.push({ source, resolve: (svg) => resolve({ svg }) })),
    )

    const wrapper = mount(MermaidDiagram, { props: { xMermaid: 'first' } })
    await flushPromises()
    await wrapper.setProps({ xMermaid: 'second' })
    await flushPromises()

    const stale = pending.find((p) => p.source === 'first')
    const fresh = pending.find((p) => p.source === 'second')
    expect(stale && fresh).toBeTruthy()

    // The newer render finishes first, then the older one finishes last — it must not overwrite it.
    fresh?.resolve('<svg data-testid="fresh"></svg>')
    await flushPromises()
    stale?.resolve('<svg data-testid="stale"></svg>')
    await flushPromises()

    expect(wrapper.html()).toContain('data-testid="fresh"')
    expect(wrapper.html()).not.toContain('data-testid="stale"')
  })

  it("removes mermaid's leftover measurement node after a failed render", async () => {
    mermaid.render.mockImplementation((id: string) => {
      // Mimic mermaid leaving its temporary `d<id>` node on <body> when the source fails to parse.
      const leftover = document.createElement('div')
      leftover.id = `d${id}`
      document.body.appendChild(leftover)
      return Promise.reject(new Error('Syntax error'))
    })

    mount(MermaidDiagram, { props: { xMermaid: 'not a diagram' } })
    await flushPromises()

    expect(document.querySelector('[id^="dmermaid-"]')).toBeNull()
  })
})
