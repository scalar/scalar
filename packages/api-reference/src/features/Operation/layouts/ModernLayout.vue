<script setup lang="ts">
import { Anchor } from '@/components/Anchor'
import { Badge } from '@/components/Badge'
import OperationPath from '@/components/OperationPath.vue'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
} from '@/components/Section'
import { ExampleRequest } from '@/features/ExampleRequest'
import { ExampleResponses } from '@/features/ExampleResponses'
import { TestRequestButton } from '@/features/TestRequestButton'
import {
  getOperationStability,
  getOperationStabilityColor,
  isOperationDeprecated,
} from '@/helpers/operation'
import { ScalarErrorBoundary, ScalarMarkdown } from '@scalar/components'
import type {
  Collection,
  Operation,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { TransformedOperation } from '@scalar/types/legacy'
import { computed, defineProps } from 'vue'

import OperationParameters from '../components/OperationParameters.vue'
import OperationResponses from '../components/OperationResponses.vue'

const { operation } = defineProps<{
  id?: string
  collection: Collection
  server: Server | undefined
  operation: Operation
  /** @deprecated Use `operation` instead */
  transformedOperation: TransformedOperation
}>()

const title = computed(() => operation.summary || operation.path || '')
</script>
<template>
  <Section
    v-if="operation"
    :id="id"
    :label="transformedOperation.name">
    <SectionContent>
      <Badge
        v-if="getOperationStability(transformedOperation)"
        :class="getOperationStabilityColor(transformedOperation)">
        {{ getOperationStability(transformedOperation) }}
      </Badge>
      <div
        :class="
          isOperationDeprecated(transformedOperation) ? 'deprecated' : ''
        ">
        <SectionHeader :level="3">
          <Anchor :id="id ?? ''">
            {{ title }}
          </Anchor>
        </SectionHeader>
      </div>
      <SectionColumns>
        <SectionColumn>
          <div class="operation-details">
            <ScalarMarkdown
              :value="operation.description"
              withImages />
            <OperationParameters :operation="operation" />
            <OperationResponses :operation="transformedOperation" />
          </div>
        </SectionColumn>
        <SectionColumn>
          <div class="examples">
            <ScalarErrorBoundary>
              <ExampleRequest
                :collection="collection"
                fallback
                :operation="operation"
                :server="server"
                :transformedOperation="transformedOperation">
                <template #header>
                  <OperationPath
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
                :operation="transformedOperation"
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
