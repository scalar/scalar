import type { ToolUIPart, UIMessagePart, UITools } from 'ai'
import { computed } from 'vue'

import { useState } from '@/state/state'

type PendingClientToolPart = ToolUIPart & { state: 'input-available' }

function isPendingClientToolPart(part: UIMessagePart<any, UITools>): part is PendingClientToolPart {
  return part.type.startsWith('tool') && (part as ToolUIPart).state === 'input-available'
}

export function useChatPendingClientToolParts() {
  const state = useState()

  const pendingClientToolParts = computed(() => {
    return state.chat.messages
      .filter((message) => message.parts.some(isPendingClientToolPart))
      .flatMap((message) => message.parts)
      .filter(isPendingClientToolPart) as PendingClientToolPart[]
  })

  return { pendingClientToolParts }
}
