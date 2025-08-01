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
    <!-- Invisble container for the anchor, adds an offset to the top of the page -->
    <span
      :id="id"
      class="pointer-events-none invisible absolute top-[-25px]">
    </span>
    <div class="group">
      <div
        class="flex"
        role="button"
        @click="handleButtonClick">
        <!-- Content -->
        <slot></slot>
        <!-- Copy button -->
        <ScalarIconLink
          class="text-c-3 hover:text-c-1 left-0 ml-1 size-4 cursor-pointer"
          weight="bold" />
      </div>
    </div>
  </template>
  <template v-else>
    <slot />
  </template>
</template>
