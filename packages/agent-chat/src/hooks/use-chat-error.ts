import { coerce, number, object, optional, string, validate, type Static } from '@scalar/validation'
import { computed } from 'vue'

import { safeParseJson } from '@/helpers'
import { useState } from '@/state/state'

const chatErrorSchema = object({
  message: string(),
  code: string(),
  status: optional(number()),
})
export type ChatError = Static<typeof chatErrorSchema>

export function useChatError() {
  const { chat } = useState()

  return computed(() => {
    if (!chat.error) return

    const errorJson = safeParseJson(chat.error.message)

    if (!errorJson || !validate(chatErrorSchema, errorJson))
      return {
        message: chat.error.message,
        code: 'UNKNOWN_ERROR',
      }

    return coerce(chatErrorSchema, errorJson)
  })
}
