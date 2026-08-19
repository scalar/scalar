import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { defaultChatCopy, formatChatCopy } from '@/copy/copy'

import ChatApprovalBar from './ChatApprovalBar.vue'

const approval = (
  overrides: Partial<{
    toolCallId: string
    toolName: string
    action: string
    destructive: boolean
  }> = {},
): { toolCallId: string; toolName: string; action?: string; destructive?: boolean } => ({
  toolCallId: 'call-1',
  toolName: 'executeRequest',
  ...overrides,
})

describe('chat-approval-bar', () => {
  it('renders nothing while no decisions are pending', () => {
    const wrapper = mount(ChatApprovalBar, { props: { approvals: [] } })

    expect(wrapper.find('.chat-approval-bar').exists()).toBe(false)
    expect(wrapper.text()).toBe('')
  })

  it('names the action for a single approval', () => {
    const wrapper = mount(ChatApprovalBar, {
      props: { approvals: [approval({ action: 'POST /planets' })] },
    })

    expect(wrapper.get('.chat-approval-bar-label').text()).toBe(
      formatChatCopy(defaultChatCopy.approval.runAction, {
        action: 'POST /planets',
      }),
    )
  })

  it('falls back to the tool name when no action is given', () => {
    const wrapper = mount(ChatApprovalBar, {
      props: { approvals: [approval()] },
    })

    expect(wrapper.get('.chat-approval-bar-label').text()).toBe(
      formatChatCopy(defaultChatCopy.approval.runAction, {
        action: 'executeRequest',
      }),
    )
  })

  it('aggregates multiple approvals into a count', () => {
    const wrapper = mount(ChatApprovalBar, {
      props: {
        approvals: [
          approval({ toolCallId: 'call-1' }),
          approval({ toolCallId: 'call-2' }),
          approval({ toolCallId: 'call-3' }),
        ],
      },
    })

    expect(wrapper.get('.chat-approval-bar-label').text()).toBe(
      formatChatCopy(defaultChatCopy.approval.approveMany, { count: 3 }),
    )
  })

  it('emits approve and reject from real buttons', async () => {
    const wrapper = mount(ChatApprovalBar, {
      props: { approvals: [approval()] },
    })

    const reject = wrapper.get('.chat-approval-bar-reject')
    const approve = wrapper.get('.chat-approval-bar-approve')

    // Real buttons participate in the natural Tab order.
    expect(reject.element.tagName).toBe('BUTTON')
    expect(approve.element.tagName).toBe('BUTTON')
    expect(reject.text()).toBe(defaultChatCopy.approval.reject)
    expect(approve.text()).toBe(defaultChatCopy.approval.approve)

    await reject.trigger('click')
    await approve.trigger('click')

    expect(wrapper.emitted('reject')).toHaveLength(1)
    expect(wrapper.emitted('approve')).toHaveLength(1)
  })

  it('marks the bar destructive and echoes the action on approve', () => {
    const wrapper = mount(ChatApprovalBar, {
      props: {
        approvals: [approval({ action: 'DELETE /planets/1', destructive: true })],
      },
    })

    expect(wrapper.get('.chat-approval-bar').classes()).toContain('chat-approval-bar-destructive')
    expect(wrapper.get('.chat-approval-bar-approve').text()).toBe('DELETE /planets/1')
  })

  it('turns destructive when any approval in the set is destructive', () => {
    const wrapper = mount(ChatApprovalBar, {
      props: {
        approvals: [approval({ toolCallId: 'call-1' }), approval({ toolCallId: 'call-2', destructive: true })],
      },
    })

    expect(wrapper.get('.chat-approval-bar').classes()).toContain('chat-approval-bar-destructive')
    // Aggregated decisions keep the generic label — there is no single
    // action to echo.
    expect(wrapper.get('.chat-approval-bar-approve').text()).toBe(defaultChatCopy.approval.approve)
  })
})
