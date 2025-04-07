<script setup lang="ts">
import { ScalarErrorBoundary, ScalarMarkdown } from '@scalar/components'
import type {
  Collection,
  Operation,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { TransformedOperation } from '@scalar/types/legacy'
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
import { ExampleRequest } from '@/features/ExampleRequest'
import { ExampleResponses } from '@/features/ExampleResponses'
import { useRequestBodyContent } from '@/features/Operation/hooks/useRequestBodyContent'
import { TestRequestButton } from '@/features/TestRequestButton'
import { useConfig } from '@/hooks/useConfig'
import {
  getOperationStability,
  getOperationStabilityColor,
  isOperationDeprecated,
} from '@/libs/operation'

import OperationParameters from '../components/OperationParameters.vue'
import OperationResponses from '../components/OperationResponses.vue'

const { operation } = defineProps<{
  id?: string
  collection: Collection
  server: Server | undefined
  operation: Operation
  /** @deprecated Use `operation` instead */
  transformedOperation: TransformedOperation
  schemas?:
    | OpenAPIV2.DefinitionsObject
    | Record<string, OpenAPIV3.SchemaObject>
    | Record<string, OpenAPIV3_1.SchemaObject>
    | unknown
}>()

const labelId = useId()
const config = useConfig()

/** The title of the operation (summary or path) */
const title = computed(() => operation.summary || operation.path)

const { selectedContentType, setContentType } = useRequestBodyContent(
  operation.requestBody,
)

const updateSelectedContentType = (contentType: string) => {
  setContentType(contentType)
}
</script>

<template>
  <Section
    :id="id"
    :aria-labelledby="labelId"
    :label="title"
    tabindex="-1">
    <SectionContent :loading="config.isLoading">
      <Badge
        v-if="getOperationStability(operation)"
        :class="getOperationStabilityColor(operation)">
        {{ getOperationStability(operation) }}
      </Badge>
      <div :class="isOperationDeprecated(operation) ? 'deprecated' : ''">
        <SectionHeader>
          <Anchor :id="id ?? ''">
            <SectionHeaderTag
              :id="labelId"
              :level="3">
              {{ title }}
            </SectionHeaderTag>
          </Anchor>
        </SectionHeader>
      </div>
      <SectionColumns>
        <SectionColumn>
          <div class="operation-details">
            <ScalarMarkdown
              :value="operation.description"
              withImages />
            <OperationParameters
              :operation="operation"
              :selected-content-type="selectedContentType"
              @update:selectedContentType="updateSelectedContentType"
              :schemas="schemas" />
            <OperationResponses
              :operation="transformedOperation"
              :schemas="schemas" />
          </div>
        </SectionColumn>
        <SectionColumn>
          <div class="examples">
            <ScalarErrorBoundary>
              <ExampleRequest
                :collection="collection"
                :selectedContentType="selectedContentType"
                fallback
                :operation="operation"
                :server="server"
                :transformedOperation="transformedOperation">
                <template #header>
                  <OperationPath
                    class="example-path"
                    :deprecated="operation.deprecated"
                    :path="operation.path" />
                </template>
                <template #footer>
                  <TestRequestButton :operation="operation" />
                </template>
              </ExampleRequest>
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
