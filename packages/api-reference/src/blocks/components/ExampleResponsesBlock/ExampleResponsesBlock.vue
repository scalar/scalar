<script lang="ts" setup>
/**
 * This component is exposed for everyone.
 * It should do the data wrangling and compose other components.
 * It should not have markup or CSS.
 */
import ThemeStyles from '@/blocks/components/ThemeStyles.vue'
import { type BlockProps, useBlockProps } from '@/blocks/hooks/useBlockProps'
import { ExampleResponses } from '@/features/ExampleResponses'

const props = defineProps<BlockProps>()

const { operation, theme } = useBlockProps(props)
</script>

<template>
  <ThemeStyles :theme="theme" />
  <ExampleResponses
    v-if="operation"
    :responses="operation.responses" />
</template>
