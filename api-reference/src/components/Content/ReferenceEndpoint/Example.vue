<script setup lang="ts">
import { EditorClasses } from '@guide/styles'

import type { Operation, Server } from '../../../types'
import ExampleRequest from './ExampleRequest.vue'
import ExampleResponse from './ExampleResponse.vue'

defineProps<{ operation: Operation; server: Server }>()
</script>
<template>
  <div
    class="example"
    :class="[EditorClasses.CodeMirror, EditorClasses.Code]">
    <ExampleRequest
      class="dark-mode"
      :operation="operation"
      :server="server" />
    <ExampleResponse :operation="operation" />
  </div>
</template>
