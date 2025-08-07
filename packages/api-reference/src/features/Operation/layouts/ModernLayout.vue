<script setup lang="ts">
import { ScalarErrorBoundary, ScalarMarkdown } from '@scalar/components'
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import {
  getOperationStability,
  getOperationStabilityColor,
  isOperationDeprecated,
} from '@scalar/oas-utils/helpers'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/path-operations'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-scheme'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import type { Dereference } from '@scalar/workspace-store/schemas/v3.1/type-guard'
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
import { useConfig } from '@/hooks/useConfig'
import { RequestExample } from '@/v2/blocks/scalar-request-example-block'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

const { path, operation, method, isWebhook } = defineProps<{
  id: string
  path: string
  clientOptions: ClientOptionGroup[]
  method: HttpMethodType
  operation: Dereference<OperationObject>
  // pathServers: ServerObject[] | undefined
  isWebhook: boolean
  securitySchemes: SecuritySchemeObject[]
  server: ServerObject | undefined
  store: WorkspaceStore
}>()

const operationTitle = computed(() => operation.summary || path || '')

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const labelId = useId()
const config = useConfig()

const handleDiscriminatorChange = (type: string) => {
  emit('update:modelValue', type)
}
</script>

<template>
  <Section
    :id="id"
    :aria-labelledby="labelId"
    :label="operationTitle"
    tabindex="-1">
    <SectionContent :loading="config.isLoading">
      <Badge
        class="capitalize"
        v-if="getOperationStability(operation)"
        :class="getOperationStabilityColor(operation)">
        {{ getOperationStability(operation) }}
      </Badge>

      <Badge
        v-if="isWebhook"
        class="font-code text-green flex w-fit items-center justify-center gap-1">
        <ScalarIconWebhooksLogo weight="bold" />Webhook
      </Badge>
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
              :value="operation.description"
              withImages
              withAnchors
              transformType="heading"
              :anchorPrefix="id" />
            <OperationParameters
              :breadcrumb="[id]"
              :parameters="operation.parameters"
              :requestBody="operation.requestBody"
              @update:modelValue="handleDiscriminatorChange">
            </OperationParameters>
            <OperationResponses
              :breadcrumb="[id]"
              :responses="operation.responses" />

            <!-- Callbacks -->
            <ScalarErrorBoundary>
              <Callbacks
                class="mt-6"
                v-if="operation.callbacks"
                :path="path"
                :callbacks="operation.callbacks"
                :method="method" />
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
                :method="method"
                :selectedServer="server"
                :clientOptions="clientOptions"
                :securitySchemes="securitySchemes"
                :selectedClient="store.workspace['x-scalar-default-client']"
                :path="path"
                fallback
                :operation="operation"
                @update:modelValue="handleDiscriminatorChange">
                <template #header>
                  <OperationPath
                    class="font-code text-c-2 [&_em]:text-c-1 [&_em]:not-italic"
                    :deprecated="operation?.deprecated"
                    :path="path" />
                </template>
                <template
                  #footer
                  v-if="!isWebhook">
                  <TestRequestButton
                    :method="method"
                    :path="path" />
                </template>
              </RequestExample>
            </ScalarErrorBoundary>

            <ScalarErrorBoundary>
              <ExampleResponses
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
