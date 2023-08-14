<script setup lang="ts">
import type { Operation, Server, Tag } from '../../../types'
import Copy from './Copy.vue'
import ExampleRequest from './ExampleRequest.vue'
import ExampleResponse from './ExampleResponse.vue'

defineProps<{ operation: Operation; server: Server; parentTag: Tag }>()
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
      <ExampleResponse :operation="operation" />
    </div>
  </div>
</template>
