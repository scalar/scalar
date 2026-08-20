import {
  type ApprovalPolicyRegistry,
  LEGACY_REJECTION_MESSAGES,
  type ToolPartLike,
  isToolPart,
  resolveApprovalDecision,
  toolNameFromPart,
} from '@scalar/chat-protocol'
import { type ComputedRef, computed, reactive } from 'vue'

import type { SessionChat } from '@/composables/create-chat-sessions'

/** The chat operations the approval store drives. Structural subset of `@ai-sdk/vue`'s `Chat`. */
export type ApprovalChat = SessionChat & {
  addToolOutput: (options: {
    tool: string
    toolCallId: string
    state?: 'output-available' | 'output-error'
    output?: unknown
    errorText?: string
  }) => void | PromiseLike<void>
  addToolApprovalResponse?: (options: { id: string; approved: boolean; reason?: string }) => void | PromiseLike<void>
}

/** One decision waiting on the user, as rendered by the composer-docked ApprovalBar. */
export type PendingApproval = {
  toolCallId: string
  toolName: string
  part: ToolPartLike
  /** True when the server asked natively (`approval-requested`); false for the client-side policy flow. */
  native: boolean
}

export type ApprovalStoreOptions = {
  chat: ApprovalChat
  /** The declarative per-tool policy replacing per-surface heuristics. */
  registry: ApprovalPolicyRegistry
  /**
   * Client-side executors per tool name, run on approval in the policy flow.
   * The executor reports its own result through `addToolOutput`.
   */
  executors?: Record<string, (part: ToolPartLike) => Promise<void>>
}

export type ApprovalStore = {
  /** Decisions currently waiting, in emission order. While non-empty, send is gated — the bar is the composer's action. */
  pending: ComputedRef<PendingApproval[]>
  /** Whether an approved executor is still running for a tool call. */
  isApplying: (toolCallId: string) => boolean
  approve: (toolCallId: string) => Promise<void>
  reject: (toolCallId: string, reason?: string) => Promise<void>
  /** Strictly sequential, in emission order — bulk approval must not interleave same-file executors. */
  approveAll: () => Promise<void>
  rejectAll: (reason?: string) => Promise<void>
}

/**
 * The one approval state shared by tool cards and the composer-docked bar
 * (both derive from it — neither owns its own copy, so the bar can never
 * show a phantom pending count while executors run).
 *
 * Dual-mode by design: handles the AI SDK's native `approval-requested`
 * parts, and the client-side policy flow the shipped servers rely on today,
 * where a pending decision is an `input-available` part held here and a
 * rejection is the legacy `output-error` encoding.
 */
export const createApprovalStore = (options: ApprovalStoreOptions): ApprovalStore => {
  const { chat, registry, executors = {} } = options

  // toolCallIds whose approved executor is currently running. Pending
  // derivation excludes them, which is what keeps the count honest.
  const applying = reactive(new Set<string>())

  // toolCallIds whose native approval response is in flight. The native part
  // stays `approval-requested` until the SDK applies the response, so without
  // this a second click (or an `approveAll` snapshot) would send a duplicate
  // `addToolApprovalResponse`. Excluding them from `pending` closes that.
  const responding = reactive(new Set<string>())

  const toolParts = (): ToolPartLike[] =>
    chat.messages.flatMap((message) =>
      message.parts.filter((part): part is ToolPartLike & { [key: string]: unknown } => isToolPart(part)),
    )

  const pending = computed<PendingApproval[]>(() =>
    toolParts().flatMap((part): PendingApproval[] => {
      if (part.state === 'approval-requested') {
        if (responding.has(part.toolCallId)) {
          return []
        }

        return [{ toolCallId: part.toolCallId, toolName: toolNameFromPart(part), part, native: true }]
      }

      const toolName = toolNameFromPart(part)

      if (
        part.state === 'input-available' &&
        // Own-property check: wire-derived tool names like `hasOwnProperty`
        // must not match through the prototype chain.
        Object.hasOwn(executors, toolName) &&
        !applying.has(part.toolCallId) &&
        resolveApprovalDecision(registry, toolName, part.input) === 'approval'
      ) {
        return [{ toolCallId: part.toolCallId, toolName, part, native: false }]
      }

      return []
    }),
  )

  const findPending = (toolCallId: string): PendingApproval | undefined =>
    pending.value.find((approval) => approval.toolCallId === toolCallId)

  /**
   * Send a native approval decision. A part without an approval id cannot be
   * answered — sending an empty id would apply the decision to the wrong call
   * (or none), so bail instead. The `responding` guard keeps the part out of
   * `pending` while the response is in flight, so a rapid double-click can no
   * longer send a duplicate `addToolApprovalResponse`; once the response
   * settles the part has transitioned and `pending` excludes it by state.
   */
  const respondNatively = async (
    toolCallId: string,
    part: ToolPartLike,
    approved: boolean,
    reason?: string,
  ): Promise<void> => {
    const id = part.approval?.id

    if (!id || !chat.addToolApprovalResponse) {
      return
    }

    responding.add(toolCallId)

    try {
      await chat.addToolApprovalResponse({ id, approved, reason })
    } finally {
      responding.delete(toolCallId)
    }
  }

  const approve = async (toolCallId: string): Promise<void> => {
    const approval = findPending(toolCallId)

    if (!approval) {
      return
    }

    if (approval.native) {
      await respondNatively(toolCallId, approval.part, true)
      return
    }

    const executor = Object.hasOwn(executors, approval.toolName) ? executors[approval.toolName] : undefined

    if (!executor) {
      return
    }

    applying.add(toolCallId)

    try {
      await executor(approval.part)
    } finally {
      applying.delete(toolCallId)
    }
  }

  const reject = async (toolCallId: string, reason?: string): Promise<void> => {
    const approval = findPending(toolCallId)

    if (!approval) {
      return
    }

    if (approval.native) {
      await respondNatively(toolCallId, approval.part, false, reason)
      return
    }

    await chat.addToolOutput({
      tool: approval.toolName,
      toolCallId,
      state: 'output-error',
      errorText: reason ?? LEGACY_REJECTION_MESSAGES[0],
    })
  }

  const approveAll = async (): Promise<void> => {
    for (const approval of [...pending.value]) {
      await approve(approval.toolCallId)
    }
  }

  const rejectAll = async (reason?: string): Promise<void> => {
    for (const approval of [...pending.value]) {
      await reject(approval.toolCallId, reason)
    }
  }

  return {
    pending,
    isApplying: (toolCallId) => applying.has(toolCallId),
    approve,
    reject,
    approveAll,
    rejectAll,
  }
}
