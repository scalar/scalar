<script setup lang="ts">
import { ScalarIcon, ScalarIconButton } from '@scalar/components'
import { useClipboard } from '@scalar/use-clipboard'

import { getOperationSectionId } from '../../../helpers'
import type { Tag, TransformedOperation } from '../../../types'
import { Anchor } from '../../Anchor'
import { SectionAccordion } from '../../Section'
import MarkdownRenderer from '../MarkdownRenderer.vue'
import EndpointDetailsCard from './EndpointDetailsCard.vue'
import EndpointPath from './EndpointPath.vue'
import ExampleRequest from './ExampleRequest.vue'
import { ResponseSchema } from './ResponseSchema'
import TryRequestButton from './TryRequestButton.vue'

defineProps<{
  operation: TransformedOperation
  tag: Tag
}>()

const { copyToClipboard } = useClipboard()
</script>
<template>
  <SectionAccordion
    :id="getOperationSectionId(operation, tag)"
    class="reference-endpoint"
    :class="`reference-endpoint--${operation.httpVerb}`"
    transparent>
    <template #title>
      <h3 class="endpoint-header">
        <div class="endpoint-details">
          <span class="endpoint-type">{{ operation.httpVerb }}</span>
          <Anchor
            :id="getOperationSectionId(operation, tag)"
            class="endpoint-anchor">
            <div class="endpoint-label">
              <div class="endpoint-label-path">
                <EndpointPath :path="operation.path" />
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
        size="full"
        variant="ghost"
        @click.stop="copyToClipboard(operation.path)" />
    </template>
    <template
      v-if="operation.description"
      #description>
      <MarkdownRenderer :value="operation.description" />
    </template>
    <div class="endpoint-content">
      <EndpointDetailsCard :operation="operation" />
      <ResponseSchema :operation="operation" />
      <ExampleRequest :operation="operation" />
    </div>
  </SectionAccordion>
</template>

<style scoped>
.reference-endpoint.reference-endpoint--post {
  color: var(--theme-color-green, var(--default-theme-color-green));
}
.reference-endpoint.reference-endpoint--patch {
  color: var(--theme-color-yellow, var(--default-theme-color-yellow));
}
.reference-endpoint.reference-endpoint--get {
  color: var(--theme-color-blue, var(--default-theme-color-blue));
}
.reference-endpoint.reference-endpoint--delete {
  color: var(--theme-color-red, var(--default-theme-color-red));
}
.reference-endpoint.reference-endpoint--put {
  color: var(--theme-color-orange, var(--default-theme-color-orange));
}

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

  width: 70px;
  padding: 6px;

  font-size: var(--theme-small, var(--default-theme-small));

  text-transform: uppercase;
  font-weight: var(--default-theme-bold);
  font-family: var(--default-theme-font);
}
.endpoint-type::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;

  background: currentColor;
  opacity: 0.15;

  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
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

  color: var(--theme-color-1, var(--default-theme-color-1));
}

.endpoint-label-path {
  font-family: var(--default-theme-font-code);
  font-size: var(--theme-mini, var(--default-theme-mini));
}
.endpoint-label-path :deep(em) {
  color: var(--theme-color-2, var(--default-theme-color-2));
}
.endpoint-label-name {
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-size: var(--theme-small, var(--default-theme-small));

  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.endpoint-try-hint {
  padding: 6px;
  height: 24px;
  aspect-ratio: 1 / 1;
  opacity: 0.44;
}

.endpoint-copy,
.endpoint-copy:hover {
  color: currentColor;
}

.endpoint-copy {
  opacity: 0.44;
  height: 14px;
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

.references-narrow .endpoint-content {
  grid-template-columns: 1fr;
}

.endpoint-content > * {
  max-height: unset;
}
</style>
