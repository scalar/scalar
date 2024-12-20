<script lang="ts" setup>
/**
 * This component is exposed for everyone.
 * It should do the data wrangling and compose other components.
 * It should not have markup or CSS.
 */
import { CodeExamplesBlock } from '@/blocks/components/CodeExamplesBlock'
import { ExampleResponsesBlock } from '@/blocks/components/ExampleResponsesBlock'
import ThemeStyles from '@/blocks/components/ThemeStyles.vue'
import { type BlockProps, useBlockProps } from '@/blocks/hooks/useBlockProps'

import OperationDetails from './components/OperationDetails.vue'

const props = defineProps<BlockProps>()

const { operation, theme } = useBlockProps(props)
</script>

<template>
  <ThemeStyles :theme="theme" />
  <div class="flex flex-col gap-2">
    <div class="border rounded-xl p-4 bg-white">
      <OperationDetails :operation="operation" />
    </div>
    <CodeExamplesBlock v-bind="$props" />
    <ExampleResponsesBlock v-bind="$props" />
  </div>
</template>
