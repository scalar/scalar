<script setup lang="ts">
import { ScalarErrorBoundary, ScalarMarkdown } from '@scalar/components'
import { ScalarIconWebhooksLogo } from '@scalar/icons'
import type {
  Collection,
  Request,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { TransformedOperation } from '@scalar/types/legacy'
import { useId } from 'vue'

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
import { ExampleRequest } from '@/features/ExampleRequest'
import { ExampleResponses } from '@/features/ExampleResponses'
import type { Schemas } from '@/features/Operation/types/schemas'
import { TestRequestButton } from '@/features/TestRequestButton'
import { useConfig } from '@/hooks/useConfig'
import {
  getOperationStability,
  getOperationStabilityColor,
  isOperationDeprecated,
} from '@/libs/openapi'

import Callbacks from '../components/callbacks/Callbacks.vue'
import OperationParameters from '../components/OperationParameters.vue'
import OperationResponses from '../components/OperationResponses.vue'

const { request, transformedOperation } = defineProps<{
  id?: string
  collection: Collection
  server: Server | undefined
  request: Request | undefined
  transformedOperation: TransformedOperation
  schemas?: Schemas
}>()

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
    :label="transformedOperation.name"
    tabindex="-1">
    <SectionContent :loading="config.isLoading">
      <Badge
        v-if="getOperationStability(transformedOperation.information)"
        :class="getOperationStabilityColor(transformedOperation.information)">
        {{ getOperationStability(transformedOperation.information) }}
      </Badge>

      <Badge
        v-if="transformedOperation.isWebhook"
        class="font-code text-green flex w-fit items-center justify-center gap-1">
        <ScalarIconWebhooksLogo weight="bold" />Webhook
      </Badge>
      <div
        :class="
          isOperationDeprecated(transformedOperation.information)
            ? 'deprecated'
            : ''
        ">
        <SectionHeader>
          <Anchor :id="id ?? ''">
            <SectionHeaderTag
              :id="labelId"
              :level="3">
              {{ transformedOperation.name }}
            </SectionHeaderTag>
          </Anchor>
        </SectionHeader>
      </div>
      <SectionColumns>
        <SectionColumn>
          <div class="operation-details">
            <ScalarMarkdown
              :value="transformedOperation.information.description"
              withImages
              withAnchors
              transformType="heading"
              :anchorPrefix="id" />
            <OperationParameters
              :parameters="transformedOperation.information.parameters"
              :requestBody="transformedOperation.information.requestBody"
              :schemas="schemas"
              @update:modelValue="handleDiscriminatorChange">
            </OperationParameters>
            <OperationResponses
              :responses="transformedOperation.information.responses"
              :schemas="schemas" />

            <!-- Callbacks -->
            <ScalarErrorBoundary>
              <Callbacks
                v-if="transformedOperation.information.callbacks"
                :callbacks="transformedOperation.information.callbacks"
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
                :method="transformedOperation.httpVerb"
                :collection="collection"
                fallback
                :operation="transformedOperation.information"
                :server="server"
                :schemas="schemas"
                @update:modelValue="handleDiscriminatorChange">
                <template #header>
                  <OperationPath
                    class="example-path"
                    :deprecated="transformedOperation.information.deprecated"
                    :path="transformedOperation.path" />
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
                :responses="transformedOperation.information.responses"
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
.deprecated * {
  text-decoration: line-through;
}
.example-path {
  color: var(--scalar-color-2);
  font-family: var(--scalar-font-code);
}
.example-path :deep(em) {
  color: var(--scalar-color-1);
  font-style: normal;
}
</style>
