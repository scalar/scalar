<script setup lang="ts">
import {
  ScalarErrorBoundary,
  ScalarIconButton,
  ScalarMarkdown,
} from '@scalar/components'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import {
  ScalarIconCopy,
  ScalarIconPlay,
  ScalarIconWebhooksLogo,
} from '@scalar/icons'
import {
  getOperationStability,
  getOperationStabilityColor,
  isOperationDeprecated,
} from '@scalar/oas-utils/helpers'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/path-operations'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-scheme'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import type { Dereference } from '@scalar/workspace-store/schemas/v3.1/type-guard'
import { computed } from 'vue'

import { Anchor } from '@/components/Anchor'
import { Badge } from '@/components/Badge'
import { HttpMethod } from '@/components/HttpMethod'
import { LinkList } from '@/components/LinkList'
import OperationPath from '@/components/OperationPath.vue'
import { SectionAccordion } from '@/components/Section'
import { ExampleResponses } from '@/features/example-responses'
import { ExternalDocs } from '@/features/external-docs'
import Callbacks from '@/features/Operation/components/callbacks/Callbacks.vue'
import OperationParameters from '@/features/Operation/components/OperationParameters.vue'
import OperationResponses from '@/features/Operation/components/OperationResponses.vue'
import { TestRequestButton } from '@/features/test-request-button'
import { useConfig } from '@/hooks/useConfig'
import { RequestExample } from '@/v2/blocks/scalar-request-example-block'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

const { operation, path, isWebhook } = defineProps<{
  id: string
  path: string
  clientOptions: ClientOptionGroup[]
  method: HttpMethodType
  operation: Dereference<OperationObject>
  // pathServers: ServerObject[] | undefined
  isWebhook: boolean
  server: ServerObject | undefined
  securitySchemes: SecuritySchemeObject[]
  store: WorkspaceStore
}>()

const operationTitle = computed(() => operation.summary || path || '')

const { copyToClipboard } = useClipboard()
const config = useConfig()
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
        v-if="active && !isWebhook"
        :method="method"
        :path="path" />
      <ScalarIconPlay
        v-else-if="!config?.hideTestRequestButton"
        class="endpoint-try-hint size-4.5" />
      <ScalarIconButton
        class="endpoint-copy p-0.5"
        :icon="ScalarIconCopy"
        label="Copy endpoint URL"
        size="xs"
        variant="ghost"
        @click.stop="copyToClipboard(path)" />
    </template>
    <template
      v-if="operation.description"
      #description>
      <ScalarMarkdown
        :value="operation.description"
        withImages
        withAnchors
        transformType="heading"
        :anchorPrefix="id" />
    </template>
    <div class="endpoint-content">
      <div class="operation-details-card">
        <div class="operation-details-card-item">
          <OperationParameters
            :requestBody="operation.requestBody"
            :parameters="operation.parameters" />
        </div>
        <div class="operation-details-card-item">
          <OperationResponses
            :collapsableItems="false"
            :responses="operation.responses" />
        </div>

        <!-- Callbacks -->
        <div
          v-if="operation?.callbacks"
          class="operation-details-card-item">
          <Callbacks
            :method="method"
            :path="path"
            :callbacks="operation.callbacks" />
        </div>
      </div>

      <ExampleResponses
        class="operation-example-card"
        :responses="operation.responses" />

      <!-- New Example Request -->
      <div>
        <!-- External Docs -->
        <LinkList v-if="operation.externalDocs">
          <ExternalDocs :value="operation.externalDocs" />
        </LinkList>
        <!-- Request Example -->
        <ScalarErrorBoundary>
          <RequestExample
            class="operation-example-card"
            :method="method"
            :selectedServer="server"
            :clientOptions="clientOptions"
            :selectedClient="store.workspace['x-scalar-default-client']"
            :securitySchemes="securitySchemes"
            :path="path"
            fallback
            :operation="operation" />
        </ScalarErrorBoundary>
      </div>
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
.operation-details :deep(.endpoint-anchor .scalar-button svg) {
  width: 16px;
  height: 16px;
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

  border-radius: var(--scalar-radius);
}

.endpoint-anchor {
  display: flex;
  align-items: center;
  min-width: 0;
  flex-shrink: 1;
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
  min-width: 0;
}

.operation-details-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.operation-details-card-item :deep(.parameter-list),
.operation-details-card-item :deep(.callbacks-list) {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
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
  padding: 0;
}
.operation-details-card :deep(.property) {
  padding: 9px;
  margin: 0;
}
.operation-details-card :deep(.parameter-list-title),
.operation-details-card :deep(.request-body-title),
.operation-details-card :deep(.callbacks-title) {
  text-transform: uppercase;
  font-weight: var(--scalar-bold);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-2);
  line-height: 1.33;
  padding: 9px;
  margin: 0;
}

.operation-details-card :deep(.callback-list-item-title) {
  padding-left: 28px;
  padding-right: 12px;
}

.operation-details-card :deep(.callback-list-item-icon) {
  left: 6px;
}

.operation-details-card :deep(.callback-operation-container) {
  padding-inline: 9px;
  padding-bottom: 9px;
}

.operation-details-card :deep(.callback-operation-container > .request-body),
.operation-details-card :deep(.callback-operation-container > .parameter-list) {
  border: none;
}

.operation-details-card
  :deep(.callback-operation-container > .request-body > .request-body-header) {
  padding: 0;
  padding-bottom: 9px;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}

.operation-details-card :deep(.request-body-description) {
  margin-top: 0;
  padding: 9px 9px 0 9px;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}

.operation-details-card :deep(.request-body) {
  margin-top: 0;
  border-radius: var(--scalar-radius-lg);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}

.operation-details-card :deep(.request-body-header) {
  padding-bottom: 0;
  border-bottom: 0;
}

.operation-details-card :deep(.contents button) {
  margin-right: 9px;
}

.operation-details-card
  :deep(.schema-card--open + .schema-card:not(.schema-card--open)) {
  margin-inline: 9px;
  margin-bottom: 9px;
}
.operation-details-card :deep(.request-body-schema .property--level-0) {
  padding: 0;
}

.operation-details-card :deep(.selected-content-type) {
  margin-right: 9px;
}

.operation-example-card {
  position: sticky;
  top: calc(var(--refs-header-height) + 24px);
  max-height: calc(((var(--full-height) - var(--refs-header-height)) - 48px));
}

@media (max-width: 600px) {
  .operation-example-card {
    max-height: unset;
    position: static;
  }
}
</style>
