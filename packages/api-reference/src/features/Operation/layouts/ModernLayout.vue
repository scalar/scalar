<script setup lang="ts">
import { OperationCodeSample } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { SecuritySchemeObjectSecret } from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import { ScalarErrorBoundary, ScalarMarkdown } from '@scalar/components'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import {
  getOperationStability,
  getOperationStabilityColor,
  isOperationDeprecated,
} from '@scalar/oas-utils/helpers'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OperationObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, useId } from 'vue'

import { Anchor } from '@/components/Anchor'
import { Badge } from '@/components/Badge'
import { LinkList } from '@/components/LinkList'
import OperationPath from '@/components/OperationPath.vue'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import AskAgentButton from '@/features/ask-agent-button/AskAgentButton.vue'
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
    | 'document'
    | 'pathValue'
    | 'server'
    | 'isCollapsed'
    | 'securitySchemes'
    | 'authStore'
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

const labelId = useId()

const operationExtensions = computed(() => getXKeysFromObject(operation))
</script>

<template>
  <Section
    :id="id"
    :aria-labelledby="labelId"
    :label="operationTitle"
    tabindex="-1"
    @intersecting="() => eventBus?.emit('intersecting:nav-item', { id })">
    <SectionContent>
      <div class="flex flex-row justify-between gap-1">
        <!-- Left -->
        <div class="flex gap-1">
          <!-- Operation ID -->
          <Badge v-if="options?.showOperationId && operation.operationId">
            {{ operation.operationId }}
          </Badge>
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
        </div>
        <!-- Right -->
        <div class="flex gap-1">
          <!-- x-badges after -->
          <XBadges
            :badges="operation['x-badges']"
            position="after" />
        </div>
      </div>
      <div :class="isOperationDeprecated(operation) ? 'deprecated' : ''">
        <SectionHeader>
          <Anchor
            @copyAnchorUrl="() => eventBus?.emit('copy-url:nav-item', { id })">
            <SectionHeaderTag
              :id="labelId"
              :level="3">
              {{ operationTitle }}
            </SectionHeaderTag>
          </Anchor>
        </SectionHeader>
      </div>
      <SectionColumns>
        <SectionColumn>
          <div class="operation-details">
            <SpecificationExtension :value="operationExtensions" />
            <ScalarMarkdown
              :anchorPrefix="id"
              aria-label="Operation Description"
              role="group"
              transformType="heading"
              :value="operation.description"
              withAnchors
              withImages />
            <OperationParameters
              :breadcrumb="[id]"
              :eventBus
              :options
              :parameters="operation.parameters"
              :requestBody="getResolvedRef(operation.requestBody)" />
            <OperationResponses
              :breadcrumb="[id]"
              :collapsableItems="!options.expandAllResponses"
              :eventBus
              :options
              :responses="operation.responses" />

            <!-- Callbacks -->
            <ScalarErrorBoundary>
              <Callbacks
                v-if="operation.callbacks"
                :callbacks="operation.callbacks"
                class="mt-6"
                :eventBus
                :options
                :path />
            </ScalarErrorBoundary>
          </div>
        </SectionColumn>
        <SectionColumn>
          <div class="examples">
            <!-- External Docs -->
            <LinkList v-if="operation.externalDocs">
              <ExternalDocs :value="operation.externalDocs" />
            </LinkList>

            <!-- New Example Request -->
            <ScalarErrorBoundary>
              <OperationCodeSample
                :clientOptions
                :eventBus
                fallback
                :isWebhook
                :method
                :operation
                :path
                :securitySchemes="selectedSecuritySchemes"
                :selectedClient
                :selectedServer>
                <template #header>
                  <OperationPath
                    class="font-code text-c-2 [&_em]:text-c-1 [&_em]:not-italic"
                    :deprecated="operation?.deprecated"
                    :path="path" />
                </template>
                <template
                  v-if="!isWebhook"
                  #footer>
                  <AskAgentButton />
                  <TestRequestButton
                    v-if="!options.hideTestRequestButton"
                    :id
                    :eventBus
                    :method
                    :path />
                </template>
              </OperationCodeSample>
            </ScalarErrorBoundary>

            <ScalarErrorBoundary>
              <ExampleResponses
                v-if="operation.responses"
                :responses="operation.responses"
                style="margin-top: 12px" />
            </ScalarErrorBoundary>
          </div>
        </SectionColumn>
      </SectionColumns>
    </SectionContent>
  </Section>
</template>

<style scoped>
.examples {
  position: sticky;
  top: calc(var(--refs-viewport-offset) + 24px);
}

.examples > * {
  max-height: calc((var(--refs-viewport-height) - 60px) / 2);
  position: relative;
}

/*
 * Don't constrain card height on mobile
 * (or zoomed in screens)
 */
@media (max-width: 600px) {
  .examples > * {
    max-height: unset;
  }
}
.deprecated * {
  text-decoration: line-through;
}
</style>
