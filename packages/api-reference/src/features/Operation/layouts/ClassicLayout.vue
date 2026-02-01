<script setup lang="ts">
import { OperationCodeSample } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { SecuritySchemeObjectSecret } from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import {
  ScalarErrorBoundary,
  ScalarIconButton,
  ScalarMarkdown,
} from '@scalar/components'
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
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OperationObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
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
import type { OperationProps } from '@/features/Operation/Operation.vue'
import { getXKeysFromObject } from '@/features/specification-extension'
import SpecificationExtension from '@/features/specification-extension/SpecificationExtension.vue'
import { TestRequestButton } from '@/features/test-request-button'
import { XBadges } from '@/features/x-badges'

const {
  clientOptions,
  eventBus,
  isWebhook,
  method,
  operation,
  options,
  path,
  selectedServer,
  selectedSecuritySchemes,
  selectedClient,
} = defineProps<
  Omit<
    OperationProps,
    'document' | 'pathValue' | 'server' | 'securitySchemes' | 'authStore'
  > & {
    /** Operation object with path params */
    operation: OperationObject
    /** The selected server for the operation */
    selectedServer: ServerObject | null
    /** The selected security schemes for the operation */
    selectedSecuritySchemes: SecuritySchemeObjectSecret[]
  }
>()

const operationTitle = computed(() => operation.summary || path || '')
const operationExtensions = computed(() => getXKeysFromObject(operation))

const { copyToClipboard } = useClipboard()
</script>
<template>
  <SectionAccordion
    :id="id"
    :aria-label="operationTitle"
    class="reference-endpoint"
    :modelValue="!isCollapsed"
    transparent
    @update:modelValue="
      (value) => eventBus?.emit('toggle:nav-item', { id, open: value })
    ">
    <template #title>
      <div class="operation-title">
        <div class="operation-details">
          <HttpMethod
            class="endpoint-type"
            :method="method"
            short />
          <Anchor
            class="endpoint-anchor"
            @copyAnchorUrl="() => eventBus?.emit('copy-url:nav-item', { id })">
            <h3 class="endpoint-label">
              <div class="endpoint-label-path">
                <OperationPath
                  :deprecated="isOperationDeprecated(operation)"
                  :path="path" />
              </div>
              <div class="endpoint-label-name">
                {{ operationTitle }}
              </div>
              <!-- Stability badge -->
              <Badge
                v-if="getOperationStability(operation)"
                class="capitalize"
                :class="getOperationStabilityColor(operation)">
                {{ getOperationStability(operation) }}
              </Badge>

              <!-- Webhook badge -->
              <Badge
                v-if="isWebhook"
                class="font-code text-green flex w-fit items-center justify-center gap-1">
                <ScalarIconWebhooksLogo weight="bold" />Webhook
              </Badge>

              <!-- x-badges before -->
              <XBadges
                :badges="operation['x-badges']"
                position="before" />
            </h3>
          </Anchor>
        </div>
      </div>
    </template>
    <template #actions="{ active }">
      <!-- x-badges after -->
      <XBadges
        :badges="operation['x-badges']"
        position="after" />
      <template v-if="!options.hideTestRequestButton">
        <TestRequestButton
          v-if="active && !isWebhook"
          :id
          :eventBus
          :method
          :path />
        <ScalarIconPlay
          v-else
          class="endpoint-try-hint size-4.5" />
      </template>
      <span
        v-if="options.showOperationId && operation.operationId"
        class="font-code text-sm">
        {{ operation.operationId }}
      </span>
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
        :anchorPrefix="id"
        aria-label="Operation Description"
        role="group"
        transformType="heading"
        :value="operation.description"
        withAnchors
        withImages />
    </template>
    <div class="endpoint-content">
      <div class="operation-details-card">
        <div
          v-if="Object.keys(operationExtensions).length > 0"
          class="operation-details-card-item">
          <SpecificationExtension :value="operationExtensions" />
        </div>
        <div class="operation-details-card-item">
          <OperationParameters
            :eventBus
            :options
            :parameters="operation.parameters"
            :requestBody="getResolvedRef(operation.requestBody)" />
        </div>
        <div class="operation-details-card-item">
          <OperationResponses
            :eventBus
            :options
            :responses="operation.responses" />
        </div>

        <!-- Callbacks -->
        <div
          v-if="operation?.callbacks"
          class="operation-details-card-item">
          <Callbacks
            :callbacks="operation.callbacks"
            :eventBus
            :options
            :path />
        </div>
      </div>

      <ExampleResponses
        v-if="operation.responses"
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
          <OperationCodeSample
            class="operation-example-card"
            :clientOptions
            :eventBus
            fallback
            :isWebhook
            :method
            :operation
            :path
            :securitySchemes="selectedSecuritySchemes"
            :selectedClient
            :selectedServer />
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
.operation-details-card
  :deep(.request-body .schema-card--level-0 > .schema-card-description) {
  padding-inline: 9px;
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
.operation-details-card :deep(.request-body-schema .property--level-0) {
  padding: 0;
}

.operation-details-card :deep(.selected-content-type) {
  margin-right: 9px;
}

.operation-example-card {
  position: sticky;
  top: calc(var(--refs-viewport-offset) + 24px);
  max-height: calc(var(--refs-viewport-height) - 48px);
}

@media (max-width: 600px) {
  .operation-example-card {
    max-height: unset;
    position: static;
  }
}
</style>
