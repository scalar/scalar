<script setup lang="ts">
import { ScalarErrorBoundary, ScalarMarkdown } from '@scalar/components'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import type {
  Collection,
  Request,
  Server,
} from '@scalar/oas-utils/entities/spec'
import {
  getOperationStability,
  getOperationStabilityColor,
  isOperationDeprecated,
} from '@scalar/oas-utils/helpers'
import type { OpenAPIV3_1, XScalarStability } from '@scalar/types/legacy'
import { computed, useId } from 'vue'

import { Anchor } from '@/components/Anchor'
import { Badge } from '@/components/Badge'
import OperationPath from '@/components/OperationPath.vue'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import { ExampleRequest } from '@/features/example-request'
import { ExampleResponses } from '@/features/example-responses'
import { TestRequestButton } from '@/features/test-request-button'
import { useConfig } from '@/hooks/useConfig'

import Callbacks from '../components/callbacks/Callbacks.vue'
import OperationParameters from '../components/OperationParameters.vue'
import OperationResponses from '../components/OperationResponses.vue'
import type { Schemas } from '../types/schemas'

const { request, operation, path, isWebhook } = defineProps<{
  id: string
  path: string
  method: OpenAPIV3_1.HttpMethods
  operation: OpenAPIV3_1.OperationObject<{
    'x-scalar-stability': XScalarStability
  }>
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
              :value="operation?.description"
              withImages
              withAnchors
              transformType="heading"
              :anchorPrefix="id" />
            <OperationParameters
              :parameters="operation?.parameters"
              :requestBody="operation?.requestBody"
              :schemas="schemas"
              @update:modelValue="handleDiscriminatorChange">
            </OperationParameters>
            <OperationResponses
              :responses="operation?.responses"
              :schemas="schemas" />

            <!-- Callbacks -->
            <ScalarErrorBoundary>
              <Callbacks
                v-if="operation?.callbacks"
                class="mt-6"
                :callbacks="operation?.callbacks"
                :collection="collection"
                :schemas="schemas" />
            </ScalarErrorBoundary>
          </div>
        </SectionColumn>
        <SectionColumn>
          <div class="examples">
            <ScalarErrorBoundary>
              <ExampleRequest
                :request="request"
                :method="method"
                :collection="collection"
                fallback
                :operation="operation"
                :server="server"
                :schemas="schemas"
                @update:modelValue="handleDiscriminatorChange">
                <template #header>
                  <OperationPath
                    class="font-code text-c-2 [&_em]:text-c-1 [&_em]:not-italic"
                    :deprecated="operation?.deprecated"
                    :path="path" />
                </template>
                <template
                  #footer
                  v-if="request">
                  <TestRequestButton :operation="request" />
                </template>
              </ExampleRequest>
            </ScalarErrorBoundary>
            <ScalarErrorBoundary>
              <ExampleResponses
                :responses="operation?.responses"
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
