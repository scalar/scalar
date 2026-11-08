import type { ToolUIPart, UIMessagePart } from 'ai'
import { type ComputedRef, computed } from 'vue'

import { executeRequestTool } from '@/client-tools/execute-request'
import { EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME } from '@/entities'
import { createDocumentSettings } from '@/helpers'
import { type Tools, useState } from '@/state/state'

type RequestToolPart = ToolUIPart & {
  type: 'tool-execute-request'
  state: 'input-available'
  input: Tools['execute-request']['input']
}

/** Every outbound request needs consent, including GET requests that can carry credentials or data. */
export function requestPartRequiresApproval(part: UIMessagePart<any, Tools>): part is RequestToolPart {
  return part.type === (`tool-${EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME}` as const) && part.state === 'input-available'
}

/** Exposes pending request approvals without leaking SDK implementation types. */
export function useRequestApprovals(): {
  approvalRequiredParts: ComputedRef<RequestToolPart[]>
  respondToRequestApprovals: (approved: boolean) => Promise<void>
} {
  const state = useState()

  const approvalRequiredParts = computed(() => {
    return state.chat.messages
      .filter((message) => message.parts.some(requestPartRequiresApproval))
      .flatMap((message) => message.parts)
      .filter(requestPartRequiresApproval)
      .filter((part) => !state.pendingRequestIds.value.has(part.toolCallId)) as RequestToolPart[]
  })

  async function respondToRequestApprovals(approved: boolean) {
    const parts = approvalRequiredParts.value
    // Claim every part synchronously before any asynchronous execution can yield.
    parts.forEach((part) => state.pendingRequestIds.value.add(part.toolCallId))
    const approvalPromises = parts.map(async (toolPart) => {
      try {
        if (!approved) {
          return await state.chat.addToolOutput({
            tool: EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME,
            toolCallId: toolPart.toolCallId,
            state: 'output-error',
            errorText: 'The user denied the request.',
          })
        }

        await executeRequestTool({
          documentSettings: createDocumentSettings(state.workspaceStore),
          proxyUrl: state.proxyUrl.value,
          input: toolPart.input,
          toolCallId: toolPart.toolCallId,
          chat: state.chat,
        })
      } finally {
        state.pendingRequestIds.value.delete(toolPart.toolCallId)
      }
    })

    await Promise.all(approvalPromises)
  }

  return { approvalRequiredParts, respondToRequestApprovals }
}
