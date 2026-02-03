import type { ToolUIPart, UIMessagePart } from 'ai'
import { computed } from 'vue'

import { executeRequestTool } from '@/client-tools/execute-request'
import { EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME } from '@/entities'
import { createDocumentSettings } from '@/helpers'
import { type Tools, useState } from '@/state/state'

type RequestToolPart = ToolUIPart & {
  type: 'tool-execute-request'
  state: 'input-available'
  input: Tools['execute-request']['input']
}

export function requestPartRequiresApproval(part: UIMessagePart<any, Tools>): part is RequestToolPart {
  return (
    part.type === (`tool-${EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME}` as const) &&
    part.state === 'input-available' &&
    part.input?.method?.toLowerCase() !== 'get'
  )
}

export function useRequestApprovals() {
  const state = useState()

  const approvalRequiredParts = computed(() => {
    return state.chat.messages
      .filter((message) => message.parts.some(requestPartRequiresApproval))
      .flatMap((message) => message.parts)
      .filter(requestPartRequiresApproval) as RequestToolPart[]
  })

  async function respondToRequestApprovals(approved: boolean) {
    const approvalPromises = approvalRequiredParts.value.map(async (toolPart) => {
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
        input: toolPart.input,
        toolCallId: toolPart.toolCallId,
        chat: state.chat,
      })
    })

    await Promise.all(approvalPromises)
  }

  return { approvalRequiredParts, respondToRequestApprovals }
}
