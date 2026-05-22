<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components/error-boundary'
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { Anchor } from '@/components/Anchor'
import { SectionAccordion, SectionHeaderTag } from '@/components/Section'

import { Schema } from '../../Schema'

const { eventBus, id, message } = defineProps<{
  id: string
  name: string
  message: AsyncApiMessageObject
  payloadSchema: SchemaObject | undefined
  isCollapsed: boolean
  eventBus: WorkspaceEventBus
  options: Pick<
    ApiReferenceConfigurationRaw,
    'orderRequiredPropertiesFirst' | 'orderSchemaPropertiesBy' | 'hideModels'
  >
}>()
</script>
<template>
  <SectionAccordion
    :id="id"
    :aria-label="message.title ?? message.name ?? name"
    :modelValue="!isCollapsed"
    @update:modelValue="
      (value) => eventBus?.emit('toggle:nav-item', { id, open: value })
    ">
    <template #title>
      <Anchor
        class="text-c-1 flex items-center pl-1.5 text-[20px]"
        :eventBus="eventBus"
        @copyAnchorUrl="() => eventBus?.emit('copy-url:nav-item', { id })">
        <SectionHeaderTag :level="3">
          <span class="font-code text-c-1 block text-sm">
            {{ message.title ?? message.name ?? name }}
          </span>
        </SectionHeaderTag>
      </Anchor>
    </template>

    <div class="mb-2 flex items-center gap-2">
      <p
        v-if="message.summary"
        class="text-c-2 m-0">
        {{ message.summary }}
      </p>
      <code
        v-if="message.contentType"
        class="bg-b-2 text-c-2 rounded px-1.5 py-0.5 text-sm">
        {{ message.contentType }}
      </code>
    </div>

    <ScalarMarkdown
      v-if="message.description"
      class="mb-3"
      :value="message.description" />

    <ScalarErrorBoundary v-if="payloadSchema">
      <Schema
        :eventBus
        :hideModelNames="options.hideModels"
        hideHeading
        :level="1"
        noncollapsible
        :options
        :schema="payloadSchema" />
    </ScalarErrorBoundary>
  </SectionAccordion>
</template>
