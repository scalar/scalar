import { type ParsedChatError, parseChatError } from '@scalar/chat-protocol'
import { type ComputedRef, computed } from 'vue'

import { useState } from '@/state/state'

/**
 * Kept as an alias so existing consumers keep compiling — the parsing now
 * lives in @scalar/chat-protocol, shared by every chat surface instead of
 * re-implemented per package.
 */
export type ChatError = ParsedChatError

export function useChatError(): ComputedRef<ChatError | undefined> {
  const { chat } = useState()

  return computed(() => (chat.error ? parseChatError(chat.error) : undefined))
}
