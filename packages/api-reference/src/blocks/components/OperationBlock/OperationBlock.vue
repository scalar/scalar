<script lang="ts" setup>
/**
 * This component is exposed for everyone.
 * It should do the data wrangling and compose other components.
 * It should not have markup or CSS.
 */
import { CodeExamplesBlock } from '@/blocks/components/CodeExamplesBlock'
import { ExampleResponsesBlock } from '@/blocks/components/ExampleResponsesBlock'
import { useBlockProps } from '@/blocks/hooks/useBlockProps'
import type { BlockProps } from '@/blocks/types'

import OperationDetails from './components/OperationDetails.vue'

const props = defineProps<BlockProps>()

const { operation } = useBlockProps(props)
</script>

<template>
  <!-- TODO: Add an empty state/loading state component -->
  <div v-if="operation">
    <!-- TODO: Remove markup and styling -->
    <div class="border rounded p-4 m-4">
      <OperationDetails :operation="operation" />
    </div>
    <div class="border rounded p-4 m-4">
      <CodeExamplesBlock v-bind="$props" />
    </div>
    <div class="border rounded p-4 m-4">
      <ExampleResponsesBlock v-bind="$props" />
    </div>
  </div>
  <div v-else>
    <p>No operation found.</p>
    <p>location: {{ location }}</p>
    <p>store: {{ store }}</p>
  </div>
</template>
