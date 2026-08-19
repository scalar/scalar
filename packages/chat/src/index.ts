export { default as ChatRoot } from '@/components/ChatRoot.vue'
export { default as ChatViewport } from '@/components/ChatViewport.vue'
export { CHAT_VIEWPORT_ANCHOR_ATTRIBUTE } from '@/components/chat-viewport'
export {
  type ApprovalChat,
  type ApprovalStore,
  type ApprovalStoreOptions,
  type PendingApproval,
  createApprovalStore,
} from '@/composables/create-approval-store'
export {
  type ChatHistory,
  type ChatHistoryOptions,
  type StoredChat,
  createChatHistory,
} from '@/composables/create-chat-history'
export {
  type ChatSessions,
  type ChatSessionsOptions,
  type SessionChat,
  createChatSessions,
  getChatTitle,
} from '@/composables/create-chat-sessions'
export { useChatError } from '@/composables/use-chat-error'
export {
  CHAT_COPY_KEY,
  type ChatCopy,
  type ChatCopyOverride,
  defaultChatCopy,
  formatChatCopy,
  mergeChatCopy,
  provideChatCopy,
  useChatCopy,
} from '@/copy/copy'
export {
  CHAT_DENSITY_KEY,
  type ChatDensity,
  chatDensityVariables,
  chatEmptyLayoutForDensity,
} from '@/density'
