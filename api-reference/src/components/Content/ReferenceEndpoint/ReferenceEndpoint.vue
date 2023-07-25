<script setup lang="ts">
import type { Operation, Server, Tag } from '../../../types'
import Copy from './Copy.vue'
import Example from './Example.vue'

defineProps<{ operation: Operation; server: Server; parentTag: Tag }>()
</script>
<template>
  <div
    :id="`endpoint/${operation.operationId}`"
    class="reference-container">
    <Copy
      :operation="operation"
      :parentTag="parentTag" />
    <Example
      :operation="operation"
      :server="server" />
  </div>
</template>
