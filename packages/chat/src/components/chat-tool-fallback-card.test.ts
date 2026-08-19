import type { ToolPartLike } from '@scalar/chat-protocol'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ChatToolFallbackCard from './ChatToolFallbackCard.vue'

const createPart = (overrides: Partial<ToolPartLike> = {}): ToolPartLike => ({
  type: 'dynamic-tool',
  toolName: 'get_planets',
  state: 'input-available',
  toolCallId: 'call-1',
  ...overrides,
})

describe('chat-tool-fallback-card', () => {
  it('narrates an input-available part as running', () => {
    const wrapper = mount(ChatToolFallbackCard, { props: { part: createPart() } })

    expect(wrapper.classes()).toContain('chat-tool-fallback-card--running')
    expect(wrapper.get('.chat-tool-fallback-card-header').text()).toContain('Calling get_planets…')
    expect(wrapper.get('.chat-tool-fallback-card-name').text()).toBe('get_planets')
    expect(wrapper.find('.chat-tool-fallback-card-status').exists()).toBe(false)
    expect(wrapper.find('.chat-tool-fallback-card-preview').exists()).toBe(false)
  })

  it('holds awaiting-approval and names the action instead of running', () => {
    const wrapper = mount(ChatToolFallbackCard, {
      props: { part: createPart(), awaitingApproval: true },
    })

    expect(wrapper.classes()).toContain('chat-tool-fallback-card--awaiting-approval')
    expect(wrapper.get('.chat-tool-fallback-card-header').text()).toContain('Run get_planets?')
  })

  it('treats an applying executor as in flight', () => {
    const wrapper = mount(ChatToolFallbackCard, {
      props: { part: createPart(), applying: true },
    })

    expect(wrapper.classes()).toContain('chat-tool-fallback-card--applying')
    expect(wrapper.get('.chat-tool-fallback-card-header').text()).toContain('Calling get_planets…')
  })

  it('renders a completed part with the called copy and an output preview', () => {
    const wrapper = mount(ChatToolFallbackCard, {
      props: { part: createPart({ state: 'output-available', output: 'Hello from the tool' }) },
    })

    expect(wrapper.classes()).toContain('chat-tool-fallback-card--complete')
    expect(wrapper.get('.chat-tool-fallback-card-header').text()).toContain('Called get_planets')
    expect(wrapper.find('.chat-tool-fallback-card-status').exists()).toBe(true)
    expect(wrapper.get('.chat-tool-fallback-card-preview').text()).toBe('Hello from the tool')
  })

  it('previews the first text content of an MCP-shaped result', () => {
    const wrapper = mount(ChatToolFallbackCard, {
      props: {
        part: createPart({
          state: 'output-available',
          output: { content: [{ type: 'text', text: 'Mercury, Venus, Earth' }] },
        }),
      },
    })

    expect(wrapper.get('.chat-tool-fallback-card-preview').text()).toBe('Mercury, Venus, Earth')
  })

  it('renders a failed part with the request-failed chip and the error preview', () => {
    const wrapper = mount(ChatToolFallbackCard, {
      props: { part: createPart({ state: 'output-error', errorText: 'boom' }) },
    })

    expect(wrapper.classes()).toContain('chat-tool-fallback-card--failed')
    expect(wrapper.get('.chat-tool-fallback-card-status').text()).toContain('Request failed')
    expect(wrapper.get('.chat-tool-fallback-card-preview').text()).toBe('boom')
  })

  it('renders a legacy rejection error part as rejected, not failed', () => {
    const wrapper = mount(ChatToolFallbackCard, {
      props: {
        part: createPart({ state: 'output-error', errorText: 'The user denied the request.' }),
      },
    })

    expect(wrapper.classes()).toContain('chat-tool-fallback-card--rejected')
    expect(wrapper.classes()).not.toContain('chat-tool-fallback-card--failed')
    expect(wrapper.get('.chat-tool-fallback-card-status').text()).not.toContain('Request failed')
    expect(wrapper.get('.chat-tool-fallback-card-preview').text()).toBe('The user denied the request.')
  })

  it('renders the editor legacy rejection payload as rejected despite output-available', () => {
    const wrapper = mount(ChatToolFallbackCard, {
      props: {
        part: createPart({
          state: 'output-available',
          output: { ok: false, rejected: true, error: 'User rejected the write. Ask what they want instead.' },
        }),
      },
    })

    expect(wrapper.classes()).toContain('chat-tool-fallback-card--rejected')
    expect(wrapper.classes()).not.toContain('chat-tool-fallback-card--complete')
    // The payload's error string is the only reason carrier in this encoding.
    expect(wrapper.get('.chat-tool-fallback-card-preview').text()).toBe(
      'User rejected the write. Ask what they want instead.',
    )
  })

  it('narrates a rejection as rejected, never as called', () => {
    // A rejected call never executed; `Called {tool}` would assert the
    // opposite of what happened, with only icon color to say otherwise.
    const wrapper = mount(ChatToolFallbackCard, {
      props: {
        part: createPart({
          type: 'tool-write_file',
          state: 'output-denied',
          approval: { id: 'appr-1', approved: false, reason: 'Keep the existing intro.' },
        }),
      },
    })

    expect(wrapper.get('.chat-tool-fallback-card-header').text()).toContain('Rejected')
    expect(wrapper.get('.chat-tool-fallback-card-header').text()).not.toContain('Called')
    // The chip carries a text label, not just a color, and the structured
    // denial reason surfaces in the preview.
    expect(wrapper.get('.chat-tool-fallback-card-status').text()).toBe('Rejected')
    expect(wrapper.get('.chat-tool-fallback-card-preview').text()).toBe('Keep the existing intro.')
  })

  it('keeps the denial reason visible when a native denial is expanded', async () => {
    // The native encoding carries no output and no errorText — the reason
    // must not vanish from the DOM when the preview yields to the body.
    const wrapper = mount(ChatToolFallbackCard, {
      props: {
        part: createPart({
          type: 'tool-write_file',
          state: 'output-denied',
          approval: { id: 'appr-1', approved: false, reason: 'Keep the existing intro.' },
        }),
      },
    })

    await wrapper.get('.chat-tool-fallback-card-header').trigger('click')

    expect(wrapper.find('.chat-tool-fallback-card-preview').exists()).toBe(false)
    expect(wrapper.get('.chat-tool-fallback-card-error').text()).toBe('Keep the existing intro.')
  })

  it('expands and collapses through the header button', async () => {
    const wrapper = mount(ChatToolFallbackCard, {
      props: {
        part: createPart({
          state: 'output-available',
          input: { id: 1 },
          output: { ok: true },
        }),
      },
    })

    const header = wrapper.get('.chat-tool-fallback-card-header')
    expect(header.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.chat-tool-fallback-card-body').exists()).toBe(false)

    await header.trigger('click')

    expect(header.attributes('aria-expanded')).toBe('true')
    const codeBlocks = wrapper.findAllComponents(ScalarCodeBlock)
    expect(codeBlocks).toHaveLength(2)
    expect(codeBlocks[0]?.props('content')).toContain('"id": 1')
    expect(codeBlocks[1]?.props('content')).toContain('"ok": true')
    // The preview yields to the expanded body.
    expect(wrapper.find('.chat-tool-fallback-card-preview').exists()).toBe(false)

    await header.trigger('click')

    expect(header.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.chat-tool-fallback-card-body').exists()).toBe(false)
  })

  it('shows the error text block instead of a result when expanded on failure', async () => {
    const wrapper = mount(ChatToolFallbackCard, {
      props: {
        part: createPart({ state: 'output-error', input: { id: 1 }, errorText: 'boom' }),
      },
    })

    await wrapper.get('.chat-tool-fallback-card-header').trigger('click')

    expect(wrapper.get('.chat-tool-fallback-card-error').text()).toBe('boom')
    // The arguments stay visible so the failure can be reproduced.
    expect(wrapper.findAllComponents(ScalarCodeBlock)).toHaveLength(1)
  })

  it('clamps the preview with the CSS class and guards the render size', () => {
    const wrapper = mount(ChatToolFallbackCard, {
      props: { part: createPart({ state: 'output-available', output: 'x'.repeat(500) }) },
    })

    const preview = wrapper.get('.chat-tool-fallback-card-preview')
    // The one-line clamp is CSS (ruling A11); only the size guard slices.
    expect(preview.classes()).toContain('chat-tool-fallback-card-preview')
    expect(preview.text()).toHaveLength(301)
    expect(preview.text().endsWith('…')).toBe(true)
  })

  it('falls back to the part type when a dynamic part has no tool name', () => {
    const wrapper = mount(ChatToolFallbackCard, {
      props: { part: createPart({ toolName: undefined }) },
    })

    expect(wrapper.get('.chat-tool-fallback-card-name').text()).toBe('dynamic-tool')
  })

  it('derives the name of a static tool part from its type', () => {
    const wrapper = mount(ChatToolFallbackCard, {
      props: { part: createPart({ type: 'tool-execute-request', toolName: undefined }) },
    })

    expect(wrapper.get('.chat-tool-fallback-card-name').text()).toBe('execute-request')
  })
})
