import type { ToolUIPart, UIMessagePart, UITools } from 'ai'
import { computed } from 'vue'

import { useState } from '@/state/state'

type ApprovalRequestedToolPart = ToolUIPart & { state: 'approval-requested' }

function isRequestedToolPart(part: UIMessagePart<any, UITools>): part is ApprovalRequestedToolPart {
  return part.type.startsWith('tool') && (part as ToolUIPart).state === 'approval-requested'
}

export function useChatApprovals() {
  const state = useState()

  const approvalRequestedParts = computed(() => {
    return state.chat.messages
      .filter((message) => message.parts.some(isRequestedToolPart))
      .flatMap((message) => message.parts)
      .filter(isRequestedToolPart) as ApprovalRequestedToolPart[]
  })

  async function respondToToolCalls(approved: boolean) {
    const approvalPromises = approvalRequestedParts.value.map((toolPart) =>
      state.chat.addToolApprovalResponse({
        id: toolPart.approval.id,
        approved,
      }),
    )

    await Promise.all(approvalPromises)
  }

  return { approvalRequestedParts, respondToToolCalls }
}
