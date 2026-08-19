import { describe, expect, it } from 'vitest'

import { defaultChatCopy, formatChatCopy, mergeChatCopy } from './copy'

describe('copy', () => {
  it('merges overrides per section without losing defaults', () => {
    const merged = mergeChatCopy({
      composer: { placeholder: 'Ask about these docs' },
      disclaimer: { short: '' },
    })

    expect(merged.composer.placeholder).toBe('Ask about these docs')
    expect(merged.composer.send).toBe('Send')
    expect(merged.disclaimer.short).toBe('')
    expect(merged.session).toEqual(defaultChatCopy.session)
  })

  it('formats placeholders', () => {
    expect(formatChatCopy('Run {action}?', { action: 'POST /planets' })).toBe('Run POST /planets?')
    expect(formatChatCopy('Approve {count} requests', { count: 3 })).toBe('Approve 3 requests')
  })

  it('leaves unknown placeholders visible instead of dropping them', () => {
    expect(formatChatCopy('Run {action}?', {})).toBe('Run {action}?')
  })

  it('bans "Clear" from the session vocabulary', () => {
    // One decline term, one delete vocabulary: the copy system must never
    // reintroduce the editor's three different "Clear" operations.
    const serialized = JSON.stringify(defaultChatCopy.session)
    expect(serialized).not.toMatch(/clear/i)
  })
})
