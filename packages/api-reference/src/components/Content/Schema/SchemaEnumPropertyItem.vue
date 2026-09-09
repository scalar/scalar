<script lang="ts" setup>
import { ScalarMarkdown } from '@scalar/components/markdown'
import { ScalarWrappingText } from '@scalar/components/wrapping-text'

defineProps<{
  label: string
  description?: string
}>()
</script>

<template>
  <li class="property-enum-row flex flex-col gap-0.5 border-t px-3 py-2">
    <span class="property-enum-row-label font-code text-c-1 text-sm">
      <ScalarWrappingText
        :text="label"
        preset="property" />
    </span>
    <span
      v-if="description"
      class="property-enum-row-description text-c-2 text-(length:--scalar-small) [&_.markdown]:-mb-0.5">
      <ScalarMarkdown :value="description" />
    </span>
  </li>
</template>
