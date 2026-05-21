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
    <ScalarCard
      class="sticky top-[calc(var(--refs-viewport-offset)+24px)] text-base">
      <ScalarCardHeader muted>
        <ScreenReader>{{ title }}</ScreenReader>
        Messages
      </ScalarCardHeader>
      <ScalarCardSection class="custom-scroll max-h-[60vh]">
        <ul
          :aria-label="`${title} messages`"
          class="bg-b-2 w-full overflow-auto px-3 py-2.5">
          <li
            v-for="message in messages"
            :key="message.id"
            class="text-c-1 font-code flex text-[length:var(--scalar-small)] leading-[1.55] whitespace-nowrap">
            {{ message.label }}
          </li>
        </ul>
      </ScalarCardSection>
    </ScalarCard>
  </template>
</template>
