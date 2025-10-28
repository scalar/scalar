<script setup lang="ts">
import {
  OperationCodeSample,
  type ClientOptionGroup,
} from '@scalar/api-client/v2/blocks/operation-code-sample'
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
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OperationObject,
  ParameterObject,
  SecuritySchemeObject,
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
import { TestRequestButton } from '@/features/test-request-button'
import { XBadges } from '@/features/x-badges'

const { operation, path } = defineProps<{
  id: string
  path: string
  method: HttpMethodType
  operation: OperationObject
  // pathServers: ServerObject[] | undefined
  server: ServerObject | undefined
  securitySchemes: SecuritySchemeObject[]
  xScalarDefaultClient: WorkspaceStore['workspace']['x-scalar-default-client']
  isCollapsed: boolean
  eventBus: WorkspaceEventBus | null
  /** Global options that can be derived from the top level config or assigned at a block level */
  options: {
    /** Sets some additional display properties when an operation is a webhook */
    isWebhook: boolean
    clientOptions: ClientOptionGroup[]
    showOperationId: boolean | undefined
    hideTestRequestButton: boolean | undefined
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()

const operationTitle = computed(() => operation.summary || path || '')

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
                v-if="options.isWebhook"
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
      <template v-if="!options?.hideTestRequestButton">
        <TestRequestButton
          v-if="active && !options.isWebhook"
          :method="method"
          :path="path" />
        <ScalarIconPlay
          v-else
          class="endpoint-try-hint size-4.5" />
      </template>
      <span
        v-if="options?.showOperationId && operation.operationId"
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
        <div class="operation-details-card-item">
          <OperationParameters
            :eventBus="eventBus"
            :options="options"
            :parameters="
              // These have been resolved in the Operation.vue component
              operation.parameters as ParameterObject[]
            "
            :requestBody="getResolvedRef(operation.requestBody)" />
        </div>
        <div class="operation-details-card-item">
          <OperationResponses
            :eventBus="eventBus"
            :options="{
              orderRequiredPropertiesFirst:
                options.orderRequiredPropertiesFirst,
              orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
            }"
            :responses="operation.responses" />
        </div>

        <!-- Callbacks -->
        <div
          v-if="operation?.callbacks"
          class="operation-details-card-item">
          <Callbacks
            :callbacks="operation.callbacks"
            :eventBus="eventBus"
            :method="method"
            :options="options"
            :path="path" />
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
            :clientOptions="options.clientOptions"
            fallback
            :isWebhook="options.isWebhook"
            :method="method"
            :operation="operation"
            :path="path"
            :securitySchemes="securitySchemes"
            :selectedClient="xScalarDefaultClient"
            :selectedServer="server" />
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
