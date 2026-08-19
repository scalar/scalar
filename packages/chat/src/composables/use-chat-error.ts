import { type ParsedChatError, parseChatError } from '@scalar/chat-protocol'
import { type ComputedRef, computed } from 'vue'

/**
 * Normalize a chat transport error for rendering — the shared replacement
 * for the three per-surface copies of the JSON-in-`Error.message` parsing.
 */
export const useChatError = (chat: { error?: Error | undefined }): ComputedRef<ParsedChatError | undefined> =>
  computed(() => (chat.error ? parseChatError(chat.error) : undefined))
