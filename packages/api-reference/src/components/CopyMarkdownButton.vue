<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarIconCheck, ScalarIconCopy } from '@scalar/icons'
import { useToasts } from '@scalar/use-toasts'
import { useTimeoutFn } from '@vueuse/core'
import { computed, onScopeDispose, ref, watch } from 'vue'

import { useLocalization } from '@/features/localization'

const { getMarkdown } = defineProps<{
  /** Generate the selected page on demand, preserving the clipboard user gesture. */
  getMarkdown: () => Promise<string>
}>()

const { translate } = useLocalization()
const { toast } = useToasts()
const copied = ref<boolean>(false)
const copying = ref<boolean>(false)
const active = ref<boolean>(true)
const icon = computed<typeof ScalarIconCheck>(() =>
  copied.value ? ScalarIconCheck : ScalarIconCopy,
)
const label = computed<string>(() =>
  copied.value
    ? translate('actions.copied')
    : translate('actions.copyAsMarkdown'),
)
onScopeDispose(() => (active.value = false))
const { start, stop } = useTimeoutFn(() => (copied.value = false), 1000, {
  immediate: false,
})

watch(
  () => getMarkdown,
  () => {
    stop()
    copied.value = false
  },
)

const copyMarkdown = async (): Promise<void> => {
  if (copying.value) {
    return
  }
  copying.value = true
  copied.value = false

  try {
    if (!navigator.clipboard) {
      throw new Error('Clipboard is unavailable')
    }
    const source = getMarkdown
    const markdown = source()

    // Safari requires the clipboard write to start during the click, before conversion finishes.
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      const blob = markdown.then(
        (text) => new Blob([text], { type: 'text/plain' }),
      )
      // A denied write may never consume the promise passed to ClipboardItem.
      void blob.catch(() => undefined)
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/plain': blob }),
      ])
    } else {
      await navigator.clipboard.writeText(await markdown)
    }

    if (active.value && getMarkdown === source) {
      copied.value = true
      start()
    }
  } catch {
    if (active.value) {
      toast(translate('actions.copyMarkdownFailed'), 'error')
    }
  } finally {
    copying.value = false
  }
}
</script>

<template>
  <ScalarButton
    class="h-6 shrink-0 px-2"
    :disabled="copying"
    :icon
    size="sm"
    variant="outlined"
    @click.stop="copyMarkdown">
    <span aria-live="polite">{{ label }}</span>
  </ScalarButton>
</template>
