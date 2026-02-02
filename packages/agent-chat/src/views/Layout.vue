<script setup lang="ts">
import { useState } from '@/state/state'
import Chat from '@/views/Chat/Chat.vue'
import Start from '@/views/Start.vue'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'uploadApi'): void
}>()

const { chat } = useState()
</script>

<template>
  <div class="wrapper">
    <Chat
      v-if="
        chat.messages.length &&
        (chat.messages.length > 1 || chat.status !== 'submitted')
      "
      @submit="emit('submit')"
      @uploadApi="emit('uploadApi')" />
    <Start
      v-else
      @submit="emit('submit')"
      @uploadApi="emit('uploadApi')" />
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 100%;
}
</style>
