<script setup lang="ts">
import {
  ScalarCard,
  ScalarCardHeader,
  ScalarCardSection,
} from '@scalar/components'

import ScreenReader from '@/components/ScreenReader.vue'

defineProps<{
  /** Title of the operation, used for the screen reader and aria labels */
  title: string
  /** The messages to list, already resolved to a name and a stable id */
  messages: { id: string; label: string }[]
}>()
</script>

<template>
  <template v-if="messages.length > 0">
    <ScalarCard class="messages-card">
      <ScalarCardHeader muted>
        <ScreenReader>{{ title }}</ScreenReader>
        Messages
      </ScalarCardHeader>
      <ScalarCardSection class="custom-scroll max-h-[60vh]">
        <ul
          :aria-label="`${title} messages`"
          class="messages">
          <li
            v-for="message in messages"
            :key="message.id"
            class="message">
            {{ message.label }}
          </li>
        </ul>
      </ScalarCardSection>
    </ScalarCard>
  </template>
</template>

<style scoped>
.messages-card {
  position: sticky;
  top: calc(var(--refs-viewport-offset) + 24px);
  font-size: var(--scalar-font-size-3);
}
.messages {
  overflow: auto;
  background: var(--scalar-background-2);
  padding: 10px 12px;
  width: 100%;
}
.message {
  display: flex;
  white-space: nowrap;
  color: var(--scalar-color-1);
  line-height: 1.55;
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-small);
}
</style>
