<script setup lang="ts">
import { ScalarIconXCircle } from '@scalar/icons'

import { AgentErrorCodes } from '@/entities/error/constants'
import { type ChatError } from '@/hooks/use-chat-error'

const { error } = defineProps<{ error: ChatError }>()

const HIDDEN_ERROR_CODES: string[] = [AgentErrorCodes.LIMIT_REACHED]
</script>

<template>
  <div
    v-if="!HIDDEN_ERROR_CODES.includes(error.code)"
    class="error">
    <ScalarIconXCircle /> {{ error.message }}
  </div>
</template>

<style scoped>
.error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  border: 1px solid var(--scalar-color-red);
  border-radius: 16px;
  background: color-mix(in srgb, var(--scalar-color-red), #000000 65%);
  margin-bottom: 10px;
  font-weight: var(--scalar-semibold);
}
</style>
