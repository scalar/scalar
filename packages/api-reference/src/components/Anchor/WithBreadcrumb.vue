<script setup lang="ts">
import { scrollToId } from '@scalar/helpers/dom/scroll-to-id'
import { sleep } from '@scalar/helpers/testing/sleep'
import { ScalarIconLink } from '@scalar/icons'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { computed } from 'vue'

import { useNavState } from '@/hooks/useNavState'

const { breadcrumb } = defineProps<{
  breadcrumb?: string[]
}>()

const { copyToClipboard } = useClipboard()
const { getHashedUrl, isIntersectionEnabled, replaceUrlState } = useNavState()

const id = computed(() => breadcrumb?.join('.'))

/**
 * Copy the URL and scroll to the anchor
 */
const handleButtonClick = async () => {
  if (!id.value) {
    return
  }

  // Copy
  copyToClipboard(getHashedUrl(id.value))

  // Disable intersection observer before we scroll
  isIntersectionEnabled.value = false

  replaceUrlState(id.value)
  scrollToId(id.value, true)

  await sleep(100)

  // Re-enable intersection observer
  isIntersectionEnabled.value = true
}
</script>

<template>
  <template v-if="breadcrumb">
    <div
      class="relative scroll-mt-24"
      :id="id">
      <!-- Content -->
      <slot />
      <button
        class="text-c-3 hover:text-c-1 absolute -top-2 -left-4.5 flex h-[calc(100%+16px)] w-4.5 cursor-pointer items-center justify-center pr-1.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        type="button"
        @click="handleButtonClick">
        <!-- Copy button -->
        <ScalarIconLink
          class="size-3"
          weight="bold" />
        <span class="sr-only">
          <slot name="sr-label">Copy link to <slot /></slot>
        </span>
      </button>
    </div>
  </template>
  <template v-else>
    <slot />
  </template>
</template>
