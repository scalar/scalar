import type { UIMessage } from 'ai'
import { nextTick, watch } from 'vue'

import { useState } from '@/state/state'

export function useChatScroll() {
  const state = useState()

  function getMsgContent(msg?: UIMessage) {
    const lastPart = msg?.parts.at(-1)
    if (!lastPart) return

    if (lastPart.type !== 'text') return

    return lastPart.text
  }

  watch([() => state.chat.status, () => getMsgContent(state.chat.lastMessage)], async () => {
    await nextTick()
    window.scrollTo(0, document.body.scrollHeight)
  })
}
