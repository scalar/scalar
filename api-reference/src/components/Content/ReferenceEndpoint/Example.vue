<script setup lang="ts">
import { useDarkModeState } from '@lib/hooks/useDarkModeState'

import { EditorClasses } from '@guide/styles'

import type { Operation, Server } from '../../../types'
import ExampleRequest from './ExampleRequest.vue'
import ExampleResponse from './ExampleResponse.vue'

defineProps<{ operation: Operation; server: Server }>()

const { isDark } = useDarkModeState()
</script>
<template>
  <div
    class="example"
    :class="[EditorClasses.CodeMirror, EditorClasses.Code]">
    <ExampleRequest
      class="dark-mode"
      :operation="operation"
      :server="server" />
    <ExampleResponse
      :class="isDark ? 'dark-mode' : 'light-mode'"
      :operation="operation" />
  </div>
</template>
../../../types
