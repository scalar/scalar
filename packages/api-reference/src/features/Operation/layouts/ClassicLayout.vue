<script setup lang="ts">
import {
  ScalarIcon,
  ScalarIconButton,
  ScalarMarkdown,
} from '@scalar/components'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import type {
  Collection,
  Request,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/types/legacy'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { computed } from 'vue'

import { Anchor } from '@/components/Anchor'
import { Badge } from '@/components/Badge'
import { HttpMethod } from '@/components/HttpMethod'
import OperationPath from '@/components/OperationPath.vue'
import { SectionAccordion } from '@/components/Section'
import { ExampleRequest } from '@/features/example-request'
import { ExampleResponses } from '@/features/example-responses'
import type { Schemas } from '@/features/Operation/types/schemas'
import { TestRequestButton } from '@/features/test-request-button'
import { useConfig } from '@/hooks/useConfig'
import {
  getOperationStability,
  getOperationStabilityColor,
  isOperationDeprecated,
} from '@/libs/openapi'

import OperationParameters from '../components/OperationParameters.vue'
import OperationResponses from '../components/OperationResponses.vue'

const { request, operation, path, isWebhook } = defineProps<{
  id: string
  path: string
  method: OpenAPIV3_1.HttpMethods
  operation: OpenAPIV3_1.OperationObject
  isWebhook: boolean
  /**
   * @deprecated Use `document` instead
   */
  collection: Collection
  server: Server | undefined
  request: Request | undefined
  schemas?: Schemas
}>()

const operationTitle = computed(() => operation?.summary || path || '')

const { copyToClipboard } = useClipboard()
const config = useConfig()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const handleDiscriminatorChange = (type: string) => {
  emit('update:modelValue', type)
}
</script>
<template>
  <SectionAccordion
    :id="id"
    class="reference-endpoint"
    transparent>
    <template #title>
      <div class="operation-title">
        <div class="operation-details">
          <HttpMethod
            class="endpoint-type"
            :method="method"
            short />
          <Anchor
            :id="id"
            class="endpoint-anchor">
            <h3 class="endpoint-label">
              <div class="endpoint-label-path">
                <OperationPath
                  :deprecated="isOperationDeprecated(operation)"
                  :path="path" />
              </div>
              <div class="endpoint-label-name">
                {{ operationTitle }}
              </div>
              <Badge
                v-if="getOperationStability(operation)"
                :class="getOperationStabilityColor(operation)">
                {{ getOperationStability(operation) }}
              </Badge>

              <Badge
                v-if="isWebhook"
                class="font-code text-green flex w-fit items-center justify-center gap-1">
                <ScalarIconWebhooksLogo weight="bold" />Webhook
              </Badge>
            </h3>
          </Anchor>
        </div>
      </div>
    </template>
    <template #actions="{ active }">
      <TestRequestButton
        v-if="active && request"
        :operation="request" />
      <ScalarIcon
        v-else-if="!config?.hideTestRequestButton"
        class="endpoint-try-hint size-6"
        icon="Play"
        thickness="1.75px" />
      <ScalarIconButton
        class="endpoint-copy p-0.5"
        icon="Clipboard"
        label="Copy endpoint URL"
        size="xs"
        variant="ghost"
        @click.stop="copyToClipboard(path)" />
    </template>
    <template
      v-if="operation?.description"
      #description>
      <ScalarMarkdown
        :value="operation?.description"
        withImages
        withAnchors
        transformType="heading"
        :anchorPrefix="id" />
    </template>
    <div class="endpoint-content">
      <div class="operation-details-card">
        <div class="operation-details-card-item">
          <OperationParameters
            :parameters="operation.parameters"
            :schemas="schemas"
            @update:modelValue="handleDiscriminatorChange" />
        </div>
        <div class="operation-details-card-item">
          <OperationResponses
            :collapsableItems="false"
            :responses="operation.responses"
            :schemas="schemas" />
        </div>
      </div>
      <ExampleResponses :responses="operation.responses" />
      <ExampleRequest
        :request="request"
        :method="method"
        :collection="collection"
        :operation="operation"
        :server="server"
        @update:modelValue="handleDiscriminatorChange" />
    </div>
  </SectionAccordion>
</template>

<style scoped>
@reference "@/style.css";

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
  flex-shrink: 0;
}
.endpoint-copy {
  color: currentColor;
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

@variant lg {
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
</style>
