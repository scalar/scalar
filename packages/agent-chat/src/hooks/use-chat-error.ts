import { computed } from 'vue'
import { z } from 'zod/mini'

import { safeParseJson } from '@/helpers'
import { useState } from '@/state/state'

const chatErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
  status: z.optional(z.number()),
})
export type ChatError = z.infer<typeof chatErrorSchema>

export function useChatError() {
  const { chat } = useState()

  return computed(() => {
    if (!chat.error) return

    const errorJson = safeParseJson(chat.error.message)
    const parsedError = chatErrorSchema.safeParse(errorJson)

    if (!errorJson || !parsedError.success)
      return {
        message: chat.error.message,
        code: 'UNKNOWN_ERROR',
      }

    return parsedError.data
  })
}
