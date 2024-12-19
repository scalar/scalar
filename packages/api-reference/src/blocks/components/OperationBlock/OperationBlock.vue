<script lang="ts" setup>
/**
 * This component is exposed for everyone.
 * It should do the data wrangling and compose other components.
 * It should not have markup or CSS.
 */
import { CodeExamplesBlock } from '@/blocks/components/CodeExamplesBlock'
import { ExampleResponsesBlock } from '@/blocks/components/ExampleResponsesBlock'
import { type BlockProps, useBlockProps } from '@/blocks/hooks/useBlockProps'

import OperationDetails from './components/OperationDetails.vue'

const props = defineProps<BlockProps>()

const { operation } = useBlockProps(props)
</script>

<template>
  <!-- TODO: Add an empty state/loading state component -->
  <div
    v-if="operation"
    class="p-4 flex gap-4 flex-col">
    <!-- TODO: Remove markup and styling -->
    <div class="border rounded p-4">
      <OperationDetails :operation="operation" />
    </div>
    <CodeExamplesBlock v-bind="$props" />
    <ExampleResponsesBlock v-bind="$props" />
  </div>
  <div v-else>
    <p>No operation found.</p>
    <p>location: {{ location }}</p>
    <p>store: {{ store }}</p>
  </div>
</template>
