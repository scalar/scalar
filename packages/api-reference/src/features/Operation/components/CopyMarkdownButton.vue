<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarIconCheck, ScalarIconCopy } from '@scalar/icons'
import { useToasts } from '@scalar/use-toasts'
import { useTimeoutFn } from '@vueuse/core'
import { computed, onScopeDispose, ref, watch } from 'vue'

import { useLocalization } from '@/features/localization'
import type { OperationProps } from '@/features/Operation/Operation.vue'

const { document, path, method, isWebhook } =
  defineProps<
    Pick<OperationProps, 'document' | 'path' | 'method' | 'isWebhook'>
  >()

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
  () => [document, path, method, isWebhook],
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
    const selection = isWebhook
      ? { webhook: { name: path, method } }
      : { operation: { path, method } }
    const source = document
    const sourcePath = path
    const sourceMethod = method
    const sourceIsWebhook = isWebhook
    const markdown = import('@scalar/openapi-to-markdown/browser').then(
      ({ createMarkdownFromOpenApi }) =>
        createMarkdownFromOpenApi(source, selection),
    )

    // Safari requires the clipboard write to start during the click, before conversion finishes.
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      const blob = markdown.then(
        (text) => new Blob([text], { type: 'text/plain' }),
      )
      // A denied write may never consume the promise passed to ClipboardItem.
      void blob.catch(() => {})
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/plain': blob }),
      ])
    } else {
      await navigator.clipboard.writeText(await markdown)
    }

    if (
      active.value &&
      document === source &&
      path === sourcePath &&
      method === sourceMethod &&
      isWebhook === sourceIsWebhook
    ) {
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
