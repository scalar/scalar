<script setup lang="ts">
import { computed } from 'vue'

const {
  title,
  subtitle,
  compact = false,
} = defineProps<{
  title?: string
  subtitle?: string
  compact?: boolean
}>()

const slots = defineSlots<{
  header?: () => unknown
  subtitle?: () => unknown
  default?: () => unknown
}>()

const hasSubtitle = computed(() => subtitle || slots.subtitle)
</script>

<template>
  <div
    class="border-border-color bg-b-2 rounded-xl border"
    :class="compact ? 'px-5 py-3' : 'px-5 py-4'">
    <!-- Header row: title + subtitle on left, header slot on right -->
    <div
      v-if="title || hasSubtitle || slots.header"
      class="mb-4 flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <h3
          v-if="title"
          class="text-c-1 m-0 text-sm font-bold tracking-wide">
          {{ title }}
        </h3>
        <p
          v-if="subtitle"
          class="text-c-2 m-0 mt-1 text-xs">
          {{ subtitle }}
        </p>
        <p
          v-else-if="slots.subtitle"
          class="text-c-2 m-0 mt-1 text-xs">
          <slot name="subtitle" />
        </p>
      </div>
      <div
        v-if="slots.header"
        class="shrink-0">
        <slot name="header" />
      </div>
    </div>
    <slot />
  </div>
</template>
