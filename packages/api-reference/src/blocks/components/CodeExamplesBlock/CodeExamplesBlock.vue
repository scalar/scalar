<script lang="ts" setup>
/**
 * This component is exposed for everyone.
 * It should do the data wrangling and compose other components.
 * It should not have markup or CSS.
 */
import { useBlockProps } from '@/blocks/hooks/useBlockProps'
import type { BlockProps } from '@/blocks/types'
import OperationPath from '@/components/OperationPath.vue'
import { ExampleRequest } from '@/features/ExampleRequest'
import { TestRequestButton } from '@/features/TestRequestButton'

const props = defineProps<BlockProps>()

const { operation } = useBlockProps(props)

const request = new Request(`https://api.example.com${operation.value?.path}`, {
  method: operation.value?.method?.toUpperCase() ?? 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})
</script>

<template>
  <div v-if="operation">
    <ExampleRequest
      fallback
      :operation="operation"
      :request="request"
      :secretCredentials="[]">
      <template #header>
        <OperationPath
          class="example-path"
          :deprecated="operation.deprecated"
          :path="operation.path" />
      </template>
      <template #footer>
        <TestRequestButton :operation="operation" />
      </template>
    </ExampleRequest>
  </div>
  <div v-else>
    <p>No operation found.</p>
    <p>location: {{ location }}</p>
    <p>store: {{ store }}</p>
  </div>
</template>
