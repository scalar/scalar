import { useMutationObserver } from '@vueuse/core'
import type { Ref } from 'vue'

export const observeMutations = (
  target: Ref<HTMLElement | null>,
  callback: MutationCallback,
) => {
  useMutationObserver(target, callback, { childList: true, subtree: true })
}
