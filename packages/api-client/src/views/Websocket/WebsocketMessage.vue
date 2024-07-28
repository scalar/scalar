<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { ref } from 'vue'

import { useWebSocket } from './useWebSocket'

const { isConnected, sendMessage } = useWebSocket()

const message = ref('')

function handleSend() {
  sendMessage(message.value)
  message.value = ''
}
</script>
<template>
  <ViewLayoutCollapse class="group/params">
    <template #title>Message</template>
    <CodeInput
      v-model="message"
      content=""
      lineNumbers />
    <button
      :disabled="!isConnected"
      type="button"
      @click="handleSend">
      send
    </button>
  </ViewLayoutCollapse>
</template>
