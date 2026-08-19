<script setup lang="ts">
import { computed, provide, toRef } from 'vue'

import { provideChatCopy, type ChatCopyOverride } from '@/copy/copy'
import {
  CHAT_DENSITY_KEY,
  chatDensityVariables,
  type ChatDensity,
} from '@/density'

/**
 * The root provider every chat surface mounts once.
 *
 * Owns the two shell-configurable axes of the system: density (the only
 * density control — primitives read the chat-scoped CSS variables it sets and
 * never branch on surface names) and the copy dictionary (English defaults,
 * deep-merged with the shell's overrides).
 */
const { density = 'default', copy = {} } = defineProps<{
  density?: ChatDensity
  copy?: ChatCopyOverride
}>()

provide(
  CHAT_DENSITY_KEY,
  toRef(() => density),
)
provideChatCopy(() => copy)

const densityVariables = computed(() => chatDensityVariables[density])
</script>

<template>
  <div
    class="chat-root"
    :style="densityVariables">
    <slot />
  </div>
</template>

<style scoped>
.chat-root {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  font-size: var(--chat-font-prose);
  color: var(--scalar-color-1);
}
</style>
