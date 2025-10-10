<script setup lang="ts">
import {
  OperationCodeSample,
  type ClientOptionGroup,
} from '@scalar/api-client/v2/blocks/operation-code-sample'
import { ScalarErrorBoundary, ScalarMarkdown } from '@scalar/components'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import {
  getOperationStability,
  getOperationStabilityColor,
  isOperationDeprecated,
} from '@scalar/oas-utils/helpers'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OperationObject,
  ParameterObject,
  SecuritySchemeObject,
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
import { ExampleResponses } from '@/features/example-responses'
import { ExternalDocs } from '@/features/external-docs'
import Callbacks from '@/features/Operation/components/callbacks/Callbacks.vue'
import OperationParameters from '@/features/Operation/components/OperationParameters.vue'
import OperationResponses from '@/features/Operation/components/OperationResponses.vue'
import { TestRequestButton } from '@/features/test-request-button'
import { XBadges } from '@/features/x-badges'

const { path, operation, method } = defineProps<{
  id: string
  path: string
  method: HttpMethodType
  operation: OperationObject
  securitySchemes: SecuritySchemeObject[]
  server: ServerObject | undefined
  xScalarDefaultClient: WorkspaceStore['workspace']['x-scalar-default-client']
  /** Global options that can be derived from the top level config or assigned at a block level */
  options: {
    /** Sets some additional display properties when an operation is a webhook */
    isWebhook: boolean
    showOperationId: boolean | undefined
    hideTestRequestButton: boolean | undefined
    expandAllResponses: boolean | undefined
    clientOptions: ClientOptionGroup[]
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()

const operationTitle = computed(() => operation.summary || path || '')

const labelId = useId()
</script>

<template>
  <Section
    :id="id"
    :aria-labelledby="labelId"
    :label="operationTitle"
    tabindex="-1">
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
            v-if="options.isWebhook"
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
          <Anchor :id="id">
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
            <ScalarMarkdown
              :anchorPrefix="id"
              transformType="heading"
              :value="operation.description"
              withAnchors
              withImages />
            <OperationParameters
              :breadcrumb="[id]"
              :options="{
                orderRequiredPropertiesFirst:
                  options.orderRequiredPropertiesFirst,
                orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
              }"
              :parameters="
                // These have been resolved in the Operation.vue component
                operation.parameters as ParameterObject[]
              "
              :requestBody="getResolvedRef(operation.requestBody)" />
            <!-- TODO: why collapsableItems being set here? -->
            <OperationResponses
              :breadcrumb="[id]"
              :options="{
                collapsableItems: !options.expandAllResponses,
                orderRequiredPropertiesFirst:
                  options.orderRequiredPropertiesFirst,
                orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
              }"
              :responses="operation.responses" />

            <!-- Callbacks -->
            <ScalarErrorBoundary>
              <Callbacks
                v-if="operation.callbacks"
                :callbacks="operation.callbacks"
                class="mt-6"
                :method="method"
                :options="options"
                :path="path" />
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
                :clientOptions="options.clientOptions"
                fallback
                :isWebhook="options.isWebhook"
                :method="method"
                :operation="operation"
                :path="path"
                :securitySchemes="securitySchemes"
                :selectedClient="xScalarDefaultClient"
                :selectedServer="server">
                <template #header>
                  <OperationPath
                    class="font-code text-c-2 [&_em]:text-c-1 [&_em]:not-italic"
                    :deprecated="operation?.deprecated"
                    :path="path" />
                </template>
                <template
                  v-if="!options.isWebhook"
                  #footer>
                  <TestRequestButton
                    v-if="!options.hideTestRequestButton"
                    :method="method"
                    :path="path" />
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
