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
    <div
      v-if="title || slots.header"
      class="flex items-center justify-between gap-2"
      :class="hasSubtitle ? 'mb-1' : 'mb-4'">
      <h3
        v-if="title"
        class="text-c-1 m-0 text-[0.8125rem] font-semibold tracking-wide">
        {{ title }}
      </h3>
      <slot name="header" />
    </div>
    <p
      v-if="subtitle"
      class="text-c-2 m-0 mb-4 text-xs leading-relaxed">
      {{ subtitle }}
    </p>
    <p
      v-else-if="slots.subtitle"
      class="text-c-2 m-0 mb-4 text-xs leading-relaxed">
      <slot name="subtitle" />
    </p>
    <slot />
  </div>
</template>
