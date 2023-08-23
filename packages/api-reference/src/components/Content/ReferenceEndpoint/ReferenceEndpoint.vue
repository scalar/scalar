<script setup lang="ts">
import type { Server, Tag, TransformedOperation } from '../../../types'
import Copy from './Copy.vue'
import ExampleRequest from './ExampleRequest.vue'
import ExampleResponses from './ExampleResponses.vue'

defineProps<{
  operation: TransformedOperation
  server: Server
  parentTag: Tag
}>()
</script>
<template>
  <div
    :id="`endpoint/${operation.operationId}`"
    class="reference-container">
    <Copy
      :operation="operation"
      :parentTag="parentTag" />
    <div class="example">
      <ExampleRequest
        :operation="operation"
        :server="server" />
      <ExampleResponses
        style="margin-top: 12px"
        :operation="operation" />
    </div>
  </div>
</template>
