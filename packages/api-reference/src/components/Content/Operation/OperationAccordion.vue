<script setup lang="ts">
import { HttpMethod } from '@scalar/api-client'
import { ScalarIcon, ScalarIconButton } from '@scalar/components'
import type { TransformedOperation } from '@scalar/oas-utils'

import { useClipboard } from '../../../hooks'
import { Anchor } from '../../Anchor'
import { MarkdownRenderer } from '../../MarkdownRenderer'
import { SectionAccordion } from '../../Section'
import EndpointDetailsCard from './EndpointDetailsCard.vue'
import EndpointPath from './EndpointPath.vue'
import ExampleRequest from './ExampleRequest.vue'
import { PathResponses } from './PathResponses'
import TryRequestButton from './TryRequestButton.vue'

defineProps<{
  id?: string
  operation: TransformedOperation
}>()

const { copyToClipboard } = useClipboard()
</script>
<template>
  <SectionAccordion
    :id="id"
    class="reference-endpoint"
    transparent>
    <template #title>
      <h3 class="endpoint-header">
        <div class="endpoint-details">
          <HttpMethod
            class="endpoint-type"
            :method="operation.httpVerb"
            short />
          <Anchor
            :id="id ?? ''"
            class="endpoint-anchor">
            <div class="endpoint-label">
              <div class="endpoint-label-path">
                <EndpointPath
                  :deprecated="operation.information?.deprecated"
                  :path="operation.path" />
              </div>
              <div class="endpoint-label-name">{{ operation.name }}</div>
            </div>
          </Anchor>
        </div>
      </h3>
    </template>
    <template #actions="{ active }">
      <TryRequestButton
        v-if="active"
        :operation="operation" />
      <ScalarIcon
        v-else
        class="endpoint-try-hint"
        icon="PaperAirplane" />
      <ScalarIconButton
        class="endpoint-copy"
        icon="Clipboard"
        label="Copy endpoint URL"
        size="sm"
        variant="ghost"
        @click.stop="copyToClipboard(operation.path)" />
    </template>
    <template
      v-if="operation.description"
      #description>
      <MarkdownRenderer
        :value="operation.description"
        withImages />
    </template>
    <div class="endpoint-content">
      <EndpointDetailsCard :operation="operation" />
      <PathResponses :operation="operation" />
      <ExampleRequest :operation="operation" />
    </div>
  </SectionAccordion>
</template>

<style scoped>
.endpoint-header {
  display: flex;
  justify-content: space-between;
}
.endpoint-details {
  display: flex;
  align-items: center;
  margin-top: 0;
  gap: 9px;

  min-width: 0;
  flex-shrink: 1;
}
.endpoint-type {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  position: relative;
  z-index: 0;

  width: 60px;
  padding: 6px;
  flex-shrink: 0;

  font-size: var(--scalar-small);

  text-transform: uppercase;
  font-weight: var(--scalar-bold);
  font-family: var(--scalar-font);
}
.endpoint-type::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;

  background: currentColor;
  opacity: 0.15;

  border-radius: var(--scalar-radius-lg);
}

.endpoint-anchor {
  display: flex;
  align-items: center;
  min-width: 0;
  flex-shrink: 1;

  font-size: 20px;
}

.endpoint-label {
  display: flex;
  align-items: baseline;
  gap: 9px;

  min-width: 0;
  flex-shrink: 1;

  color: var(--scalar-color-1);
}

.endpoint-label-path {
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-mini);

  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.endpoint-label-path :deep(em) {
  color: var(--scalar-color-2);
}
.endpoint-label-name {
  color: var(--scalar-color-2);
  font-size: var(--scalar-small);

  /* Concatenate the name before we shrink the path */
  flex-shrink: 1000000000;

  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.endpoint-try-hint {
  padding: 6px;
  height: 24px;
  width: 24px;
  flex-shrink: 0;
  opacity: 0.44;
}

.endpoint-copy,
.endpoint-copy:hover {
  color: currentColor;
}

.endpoint-copy {
  opacity: 0.44;
}
.endpoint-copy:hover {
  opacity: 1;
}

.endpoint-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
  padding: 9px;
}

@container (max-width: 900px) {
  .endpoint-content {
    grid-template-columns: 1fr;
  }
}

.endpoint-content > * {
  max-height: unset;
}
</style>
