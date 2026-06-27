<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
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

import AsyncApiBindings from './AsyncApiBindings.vue'
import AsyncApiLabels from './AsyncApiLabels.vue'
import AsyncApiTags from './AsyncApiTags.vue'
import { adaptAsyncApiParameters } from './helpers/adapt-async-api-parameters'
import {
  resolveSchemaRenderOptions,
  type AsyncApiSchemaRenderOptions,
} from './helpers/async-api-render-options'
import { filterChildrenByType } from './helpers/filter-children-by-type'
import { getChannelServerLabels } from './helpers/get-async-api-labels'
import { pickHeading } from './helpers/pick-heading'
import { resolveAsyncApiChannel } from './helpers/resolve-async-api-nodes'
import Operation from './Operation.vue'

/** Subset of the configuration the shared `ParameterList` renderer needs. */
type ParameterListOptions = AsyncApiSchemaRenderOptions &
  Pick<ApiReferenceConfigurationRaw, 'hideModels'>

const {
  channel,
  document,
  layout,
  isCollapsed,
  eventBus,
  options,
  expandedItems = {},
  level = 0,
} = defineProps<{
  channel: TraversedAsyncApiChannel
  document: AsyncApiDocument
  layout: 'classic' | 'modern'
  isCollapsed: boolean
  eventBus: WorkspaceEventBus | null
  options?: Partial<ParameterListOptions>
  /** Map of navigation item id to expanded state, shared with the sidebar. */
  expandedItems?: Record<string, boolean>
  /**
   * Nesting depth in the navigation tree. A channel nested inside a tag
   * (`level !== 0`) inherits the tag's horizontal padding, so it skips its own
   * `SectionContainer` padding to avoid doubling the indentation.
   */
  level?: number
}>()

const headerId = useId()

/**
 * Resolve the channel from the document so we can read its description.
 * The navigation entry only carries the address and identifying keys.
 */
const resolvedChannel = computed(() =>
  resolveAsyncApiChannel(document, channel.channelName),
)

const description = computed(() => resolvedChannel.value?.description ?? '')

/**
 * Heading shown above each channel section.
 *
 * Prefers the human-friendly `channel.title` when it is set, then falls back
 * to `channel.address`. `channel.channelAddress` already encodes the
 * address-or-key fallback during navigation traversal, so we only need to
 * overlay `title` on top of it.
 */
const headingText = computed(() =>
  pickHeading(resolvedChannel.value?.title, channel.channelAddress),
)

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
  ...resolveSchemaRenderOptions(options),
}))

/**
 * Server-name and protocol labels for the channel, resolved from `document.servers`
 * (restricted to `channel.servers` when declared) and rendered as pills in the header.
 */
const labels = computed(() =>
  getChannelServerLabels(document, resolvedChannel.value),
)

/** Operations that target this channel, rendered nested beneath the channel content. */
const operations = computed(() =>
  filterChildrenByType<TraversedAsyncApiOperation>(
    channel.children,
    'asyncapi-operation',
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
      <AsyncApiLabels
        class="channel-labels"
        :protocols="labels.protocols"
        :servers="labels.servers" />
      <ScalarMarkdown
        class="channel-description"
        :value="description"
        withImages />
    </template>
    <AsyncApiTags
      :externalDocs="resolvedChannel?.externalDocs"
      :tags="resolvedChannel?.tags" />
    <AsyncApiBindings :bindings="resolvedChannel?.bindings" />
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
    :omit="level !== 0"
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
        <AsyncApiLabels
          class="channel-labels"
          :protocols="labels.protocols"
          :servers="labels.servers" />
        <ScalarMarkdown
          :value="description"
          withImages />
        <AsyncApiTags
          :externalDocs="resolvedChannel?.externalDocs"
          :tags="resolvedChannel?.tags" />
        <AsyncApiBindings :bindings="resolvedChannel?.bindings" />
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
.channel-labels {
  margin-bottom: 8px;
}
.channel-description {
  padding-bottom: 4px;
  text-align: left;
}
</style>
