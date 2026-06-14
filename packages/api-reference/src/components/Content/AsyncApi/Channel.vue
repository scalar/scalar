<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type {
  AsyncApiChannelObject,
  AsyncApiDocument,
} from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  getResolvedRef,
  mergeSiblingReferences,
} from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  TraversedAsyncApiChannel,
  TraversedAsyncApiOperation,
} from '@scalar/workspace-store/schemas/navigation'
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
import ParameterList from '@/features/Operation/components/ParameterList.vue'

import { adaptAsyncApiParameters } from './helpers/adapt-async-api-parameters'
import Operation from './Operation.vue'

/** Subset of the configuration the shared `ParameterList` renderer needs. */
type ParameterListOptions = Pick<
  ApiReferenceConfigurationRaw,
  | 'hideModels'
  | 'orderRequiredPropertiesFirst'
  | 'orderSchemaPropertiesBy'
  | 'expandAllSchemaProperties'
>

const {
  channel,
  document,
  layout,
  isCollapsed,
  eventBus,
  options,
  expandedItems = {},
} = defineProps<{
  channel: TraversedAsyncApiChannel
  document: AsyncApiDocument
  layout: 'classic' | 'modern'
  isCollapsed: boolean
  eventBus: WorkspaceEventBus | null
  options?: Partial<ParameterListOptions>
  /** Map of navigation item id to expanded state, shared with the sidebar. */
  expandedItems?: Record<string, boolean>
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

/**
 * Channel address parameters mapped into the OpenAPI parameter shape so we can reuse the shared
 * `ParameterList` component instead of building a dedicated AsyncAPI renderer.
 */
const parameters = computed(() =>
  adaptAsyncApiParameters(resolvedChannel.value?.parameters),
)

/** Fill in defaults so the shared renderer always receives a complete options object. */
const parameterListOptions = computed<ParameterListOptions>(() => ({
  hideModels: options?.hideModels ?? false,
  orderRequiredPropertiesFirst: options?.orderRequiredPropertiesFirst ?? false,
  orderSchemaPropertiesBy: options?.orderSchemaPropertiesBy ?? 'preserve',
  expandAllSchemaProperties: options?.expandAllSchemaProperties ?? false,
}))

/** Operations that target this channel, rendered nested beneath the channel content. */
const operations = computed(() =>
  (channel.children ?? []).filter(
    (child): child is TraversedAsyncApiOperation =>
      child.type === 'asyncapi-operation',
  ),
)
</script>

<template>
  <SectionContainerAccordion
    v-if="layout === 'classic'"
    :aria-label="headingText"
    class="channel-section"
    :modelValue="!isCollapsed"
    @update:modelValue="
      (value) =>
        eventBus?.emit('toggle:nav-item', { id: channel.id, open: value })
    ">
    <template #title>
      <SectionHeader class="channel-name">
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
        class="channel-description"
        :value="description"
        withImages />
    </template>
    <ParameterList
      v-if="parameters.length"
      :eventBus="eventBus"
      :options="parameterListOptions"
      :parameters="parameters">
      <template #title>Parameters</template>
    </ParameterList>
    <Operation
      v-for="operation in operations"
      :key="operation.id"
      :document="document"
      :eventBus="eventBus"
      :expandedItems="expandedItems"
      :operation="operation"
      :options="options" />
  </SectionContainerAccordion>

  <SectionContainer
    v-else
    :aria-labelledby="headerId"
    role="region">
    <Section
      :id="channel.id"
      role="none"
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
        <ParameterList
          v-if="parameters.length"
          :eventBus="eventBus"
          :options="parameterListOptions"
          :parameters="parameters">
          <template #title>Parameters</template>
        </ParameterList>
        <Operation
          v-for="operation in operations"
          :key="operation.id"
          :document="document"
          :eventBus="eventBus"
          :expandedItems="expandedItems"
          :operation="operation"
          :options="options" />
      </SectionContent>
    </Section>
  </SectionContainer>
</template>

<style scoped>
.channel-section {
  margin-bottom: 48px;
}
.channel-description {
  padding-bottom: 4px;
  text-align: left;
}
</style>
