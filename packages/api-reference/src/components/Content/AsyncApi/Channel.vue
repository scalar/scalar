<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import type {
  AsyncApiChannelObject,
  AsyncApiDocument,
} from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  getResolvedRef,
  mergeSiblingReferences,
} from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { TraversedAsyncApiChannel } from '@scalar/workspace-store/schemas/navigation'
import { computed, useId } from 'vue'

import { Anchor } from '@/components/Anchor'
import {
  Section,
  SectionContainer,
  SectionContainerAccordion,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'

const {
  channel,
  document,
  layout,
  isCollapsed,
  eventBus,
  level = 0,
} = defineProps<{
  channel: TraversedAsyncApiChannel
  document: AsyncApiDocument
  layout: 'classic' | 'modern'
  isCollapsed: boolean
  eventBus: WorkspaceEventBus | null
  /** Nesting depth, used to skip the outer container padding when nested. */
  level?: number
}>()

const headerId = useId()

/**
 * Resolve the channel from the document so we can read its description.
 * The navigation entry only carries the address and identifying keys.
 */
const resolvedChannel = computed<AsyncApiChannelObject | undefined>(() => {
  const node = document.channels?.[channel.channelName]
  return node ? getResolvedRef(node, mergeSiblingReferences) : undefined
})

const description = computed(() => resolvedChannel.value?.description ?? '')

/**
 * Heading shown above each channel section.
 *
 * Prefers the human-friendly `channel.title` when it is set, then falls back
 * to `channel.address`, and finally to the channel map key.
 * `channel.channelAddress` already encodes the address-or-key fallback during
 * navigation traversal, so we only need to overlay `title` on top of it.
 */
const headingText = computed(() => {
  const title = resolvedChannel.value?.title?.trim()
  return title || channel.channelAddress
})
</script>

<template>
  <SectionContainerAccordion
    v-if="layout === 'classic'"
    :aria-label="headingText"
    class="mb-12"
    :modelValue="!isCollapsed"
    @update:modelValue="
      (value) =>
        eventBus?.emit('toggle:nav-item', { id: channel.id, open: value })
    ">
    <template #title>
      <SectionHeader>
        <Anchor
          @copyAnchorUrl="
            () => eventBus?.emit('copy-url:nav-item', { id: channel.id })
          ">
          <SectionHeaderTag :level="2">
            {{ headingText }}
          </SectionHeaderTag>
        </Anchor>
      </SectionHeader>
      <ScalarMarkdown
        class="pb-1 text-left"
        :value="description"
        withImages />
    </template>

    <!-- Operations (and their messages) render as their own sections below. -->
    <div class="contents divide-y">
      <slot />
    </div>
  </SectionContainerAccordion>

  <SectionContainer
    v-else
    :omit="level !== 0">
    <Section
      :id="channel.id"
      :aria-labelledby="headerId"
      role="region"
      @intersecting="
        () => eventBus?.emit('intersecting:nav-item', { id: channel.id })
      ">
      <SectionHeader>
        <Anchor
          @copyAnchorUrl="
            () => eventBus?.emit('copy-url:nav-item', { id: channel.id })
          ">
          <SectionHeaderTag
            :id="headerId"
            :level="2">
            {{ headingText }}
          </SectionHeaderTag>
        </Anchor>
      </SectionHeader>
      <SectionContent>
        <ScalarMarkdown
          :value="description"
          withImages />
      </SectionContent>
    </Section>

    <!-- Operations (and their messages) render as their own sections below. -->
    <div class="contents divide-y">
      <slot />
    </div>
  </SectionContainer>
</template>
