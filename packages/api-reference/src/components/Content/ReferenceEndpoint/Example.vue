<script setup lang="ts">
import type { Operation, Server } from '../../../types'
import ExampleRequest from './ExampleRequest.vue'
import ExampleResponse from './ExampleResponse.vue'

defineProps<{ operation: Operation; server: Server }>()
</script>
<template>
  <div class="example">
    <ExampleRequest
      :operation="operation"
      :server="server" />
    <ExampleResponse :operation="operation" />
  </div>
</template>
