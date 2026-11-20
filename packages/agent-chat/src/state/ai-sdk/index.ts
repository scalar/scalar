// This dependency must evaluate before the SDK constructs its Zod schemas.
import '@scalar/types/zod'

export { Chat } from '@ai-sdk/vue'
export { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
