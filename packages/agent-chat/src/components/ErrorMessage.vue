<script setup lang="ts">
import { ScalarIconInfo } from '@scalar/icons'

import { AgentErrorCodes } from '@/entities/error/constants'
import { type ChatError } from '@/hooks/use-chat-error'

const { error } = defineProps<{ error: ChatError }>()

const HIDDEN_ERROR_CODES: string[] = [AgentErrorCodes.LIMIT_REACHED]
</script>

<template>
  <div
    v-if="!HIDDEN_ERROR_CODES.includes(error.code)"
    class="error gap-1.5">
    <ScalarIconInfo
      class="text-red size-4"
      weight="bold" />
    {{ error.message }}
  </div>
</template>

<style scoped>
.error {
  display: flex;
  align-items: center;
  margin-bottom: -16px;
  padding: 8px 8px 24px 12px;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: 16px 16px 0 0;
  background: color-mix(
    in srgb,
    var(--scalar-color-red),
    var(--scalar-background-1) 95%
  );
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-font-size-3);
  position: absolute;
  top: 0;
  transform: translate3d(0, calc(-100% + 16px), 0);
}
</style>
