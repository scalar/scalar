<script setup lang="ts">
import {
  ScalarCard,
  ScalarCardHeader,
  ScalarCardSection,
} from '@scalar/components/card'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  TraversedAsyncApiChannel,
  TraversedTag,
} from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import ScreenReader from '@/components/ScreenReader.vue'
import { useLocalization } from '@/features/localization'

const { tag } = defineProps<{
  tag: TraversedTag
  eventBus: WorkspaceEventBus | null
}>()
const { translate } = useLocalization()

/**
 * Channels grouped under this tag. The OpenAPI `OperationsList` only knows about
 * `operation`/`webhook` children, so AsyncAPI tags need their own list that links
 * straight to each channel section.
 */
const channels = computed(
  () =>
    tag.children?.filter(
      (child): child is TraversedAsyncApiChannel =>
        child.type === 'asyncapi-channel',
    ) ?? [],
)
</script>

<template>
  <ScalarCard
    v-if="channels.length"
    class="channels-card">
    <ScalarCardHeader muted>
      <ScreenReader>{{ tag.title }}</ScreenReader>
      {{ translate('navigation.channels') }}
    </ScalarCardHeader>
    <ScalarCardSection class="custom-scroll max-h-[60vh]">
      <ul
        :aria-label="translate('navigation.channels')"
        class="channels">
        <li
          v-for="channel in channels"
          :key="channel.id"
          class="contents">
          <a
            class="channel"
            @click.prevent="
              () => eventBus?.emit('scroll-to:nav-item', { id: channel.id })
            ">
            {{ channel.title || channel.channelAddress }}
          </a>
        </li>
      </ul>
    </ScalarCardSection>
  </ScalarCard>
</template>

<style scoped>
.channels-card {
  position: sticky;
  top: calc(var(--refs-viewport-offset) + 24px);
  font-size: var(--scalar-font-size-3);
}
.channels {
  overflow: auto;
  background: var(--scalar-background-2);
  padding: 10px 12px;
  width: 100%;
}
.channel {
  display: flex;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  color: var(--scalar-color-1);
  line-height: 1.55;
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-small);
}
.channel:hover,
.channel:focus-visible {
  text-decoration: underline;
}
</style>
