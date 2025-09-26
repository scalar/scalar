<script setup lang="ts">
import { ScalarErrorBoundary, ScalarMarkdown } from '@scalar/components'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import {
  getOperationStability,
  getOperationStabilityColor,
  isOperationDeprecated,
} from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfiguration } from '@scalar/types'
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
import { RequestExample } from '@/v2/blocks/scalar-request-example-block'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

const { path, config, operation, method, isWebhook } = defineProps<{
  id: string
  path: string
  clientOptions: ClientOptionGroup[]
  config: ApiReferenceConfiguration
  method: HttpMethodType
  operation: OperationObject
  // pathServers: ServerObject[] | undefined
  isWebhook: boolean
  securitySchemes: SecuritySchemeObject[]
  server: ServerObject | undefined
  store: WorkspaceStore
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
    <SectionContent :loading="config.isLoading">
      <div class="flex flex-row justify-between gap-1">
        <!-- Left -->
        <div class="flex gap-1">
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
              :parameters="
                // These have been resolved in the Operation.vue component
                operation.parameters as ParameterObject[]
              "
              :requestBody="getResolvedRef(operation.requestBody)" />
            <OperationResponses
              :breadcrumb="[id]"
              :collapsableItems="!config.expandAllResponses"
              :responses="operation.responses" />

            <!-- Callbacks -->
            <ScalarErrorBoundary>
              <Callbacks
                v-if="operation.callbacks"
                :callbacks="operation.callbacks"
                class="mt-6"
                :method="method"
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
              <RequestExample
                :clientOptions="clientOptions"
                fallback
                :method="method"
                :operation="operation"
                :path="path"
                :isWebhook="isWebhook"
                :securitySchemes="securitySchemes"
                :selectedClient="store.workspace['x-scalar-default-client']"
                :selectedServer="server">
                <template #header>
                  <OperationPath
                    class="font-code text-c-2 [&_em]:text-c-1 [&_em]:not-italic"
                    :deprecated="operation?.deprecated"
                    :path="path" />
                </template>
                <template
                  v-if="!isWebhook"
                  #footer>
                  <TestRequestButton
                    :method="method"
                    :path="path" />
                </template>
              </RequestExample>
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
  top: calc(var(--refs-header-height) + 24px);
}

.examples > * {
  max-height: calc(
    ((var(--full-height) - var(--refs-header-height)) - 60px) / 2
  );
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
