<script setup lang="ts">
import { ScalarIconCaretDown, ScalarIconCaretRight } from '@scalar/icons'
import { ref } from 'vue'

const { title, selectedCount, totalCount } = defineProps<{
  title: string
  selectedCount: number
  totalCount: number
}>()

const isCollapsed = ref(false)

function toggle(): void {
  isCollapsed.value = !isCollapsed.value
}
</script>

<template>
  <li class="mb-3 last:mb-0">
    <button
      class="hover:bg-b-3 border-border-color bg-b-2 flex w-full cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 transition-colors duration-150"
      type="button"
      @click="toggle">
      <component
        :is="isCollapsed ? ScalarIconCaretRight : ScalarIconCaretDown"
        class="text-c-3 size-4 shrink-0" />
      <span class="text-c-2 flex-1 text-left text-xs font-semibold">
        {{ title }}
      </span>
      <span
        class="bg-b-3 text-c-3 rounded px-2 py-0.5 text-[0.6875rem] font-medium">
        {{ selectedCount }} / {{ totalCount }}
      </span>
    </button>
    <div
      v-show="!isCollapsed"
      class="mt-2">
      <slot />
    </div>
  </li>
</template>
