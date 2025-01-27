<script setup lang="ts">
import { Anchor } from '@/components/Anchor'
import { Badge } from '@/components/Badge'
import { HttpMethod } from '@/components/HttpMethod'
import OperationPath from '@/components/OperationPath.vue'
import { SectionAccordion } from '@/components/Section'
import { ExampleRequest } from '@/features/ExampleRequest'
import { ExampleResponses } from '@/features/ExampleResponses'
import { TestRequestButton } from '@/features/TestRequestButton'
import {
  getOperationStability,
  getOperationStabilityColor,
  isOperationDeprecated,
} from '@/helpers'
import { useConfig } from '@/hooks/useConfig'
import {
  ScalarIcon,
  ScalarIconButton,
  ScalarMarkdown,
} from '@scalar/components'
import type { Request as RequestEntity } from '@scalar/oas-utils/entities/spec'
import type { TransformedOperation } from '@scalar/types/legacy'
import { useClipboard } from '@scalar/use-hooks/useClipboard'

import OperationParameters from '../components/OperationParameters.vue'
import OperationResponses from '../components/OperationResponses.vue'

defineProps<{
  id?: string
  requestEntity?: RequestEntity
  /** @deprecated Use `requestEntity` instead */
  operation: TransformedOperation
  request: Request | null
  secretCredentials: string[]
}>()

const { copyToClipboard } = useClipboard()
const config = useConfig()
</script>
<template>
  <SectionAccordion
    :id="id"
    class="reference-endpoint"
    transparent>
    <template #title>
      <h3 class="operation-title">
        <div class="operation-details">
          <HttpMethod
            class="endpoint-type"
            :method="operation.httpVerb"
            short />
          <Anchor
            :id="id ?? ''"
            class="endpoint-anchor">
            <div class="endpoint-label">
              <div class="endpoint-label-path">
                <OperationPath
                  :deprecated="isOperationDeprecated(operation)"
                  :path="operation.path" />
              </div>
              <div class="endpoint-label-name">{{ operation.name }}</div>
              <Badge
                v-if="getOperationStability(operation)"
                :class="getOperationStabilityColor(operation)">
                {{ getOperationStability(operation) }}
              </Badge>
            </div>
          </Anchor>
        </div>
      </h3>
    </template>
    <template #actions="{ active }">
      <TestRequestButton
        v-if="active"
        :operation="requestEntity" />
      <ScalarIcon
        v-else-if="!config?.hideTestRequestButton"
        class="endpoint-try-hint"
        icon="Play"
        thickness="1.75px" />
      <ScalarIconButton
        class="endpoint-copy"
        icon="Clipboard"
        label="Copy endpoint URL"
        size="xs"
        variant="ghost"
        @click.stop="copyToClipboard(operation.path)" />
    </template>
    <template
      v-if="requestEntity?.description"
      #description>
      <ScalarMarkdown
        :value="requestEntity?.description"
        withImages />
    </template>
    <div class="endpoint-content">
      <div class="operation-details-card">
        <div class="operation-details-card-item">
          <OperationParameters :operation="requestEntity" />
        </div>
        <div class="operation-details-card-item">
          <OperationResponses
            :collapsableItems="false"
            :operation="operation" />
        </div>
      </div>
      <ExampleResponses :operation="operation" />
      <ExampleRequest
        :operation="operation"
        :request="request"
        :secretCredentials="secretCredentials" />
    </div>
  </SectionAccordion>
</template>

<style scoped>
.operation-title {
  display: flex;
  justify-content: space-between;
}
.operation-details {
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
.endpoint-anchor.label {
  display: flex;
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
  padding: 2px;
  height: 24px;
  width: 24px;
  flex-shrink: 0;
}
.endpoint-copy {
  color: currentColor;
  padding: 2px;
}
.endpoint-copy :deep(svg) {
  stroke-width: 2px;
}

.endpoint-content {
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: row;
  gap: 9px;
  padding: 9px;
}

@screen lg {
  .endpoint-content {
    grid-auto-flow: column;
  }
}

@container (max-width: 900px) {
  .endpoint-content {
    grid-template-columns: 1fr;
  }
}

.endpoint-content > * {
  max-height: unset;
}

.operation-details-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.operation-details-card-item :deep(.parameter-list) {
  border: 1px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  margin-top: 0;
}

.operation-details-card-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.operation-details-card-item :deep(.parameter-list-items) {
  margin-bottom: 0;
}
.operation-details-card :deep(.parameter-item:last-of-type .parameter-schema) {
  padding-bottom: 12px;
}
.operation-details-card :deep(.parameter-list .parameter-list) {
  margin-bottom: 12px;
}
.operation-details-card :deep(.parameter-item) {
  margin: 0;
  padding: 0 9px;
}
.operation-details-card :deep(.property) {
  padding: 9px;
  margin: 0;
}
.operation-details-card :deep(.parameter-list-title),
.operation-details-card :deep(.request-body-title) {
  text-transform: uppercase;
  font-weight: var(--scalar-bold);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-2);
  line-height: 1.33;
  padding: 9px;
  margin: 0;
}
.operation-details-card :deep(.request-body-title-select) {
  text-transform: initial;
  font-weight: initial;
  margin-left: auto;
}
</style>
