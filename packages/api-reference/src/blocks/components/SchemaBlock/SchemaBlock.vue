<script lang="ts" setup>
/**
 * This component is exposed for everyone.
 * It should do the data wrangling and compose other components.
 * It should not have markup or CSS.
 */
import ThemeStyles from '@/blocks/components/ThemeStyles.vue'
import { type BlockProps, useBlockProps } from '@/blocks/hooks/useBlockProps'
import { Schema } from '@/components/Content/Schema'

const props = defineProps<BlockProps>()

const { schema, theme } = useBlockProps(props)
</script>

<template>
  <ThemeStyles :theme="theme" />
  <div class="border rounded-xl p-4 bg-white">
    <Schema
      v-if="schema"
      :hideHeading="true"
      noncollapsible
      :value="schema as any" />
  </div>
</template>
