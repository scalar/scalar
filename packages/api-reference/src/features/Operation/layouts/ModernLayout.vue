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
import type { ExampleRequestProps } from '@/features/ExampleRequest/ExampleRequest.vue'
import { ExampleResponses } from '@/features/ExampleResponses'
import { TestRequestButton } from '@/features/TestRequestButton'
import { ScalarErrorBoundary, ScalarMarkdown } from '@scalar/components'

import OperationParameters from '../components/OperationParameters.vue'
import OperationResponses from '../components/OperationResponses.vue'

const { id, operation, ...exampleRequestProps } = defineProps<
  {
    id?: string
  } & ExampleRequestProps
>()
</script>
<template>
  <Section
    :id="id"
    :label="operation.name">
    <SectionContent>
      <Badge v-if="operation.information?.deprecated"> Deprecated </Badge>
      <div :class="operation.information?.deprecated ? 'deprecated' : ''">
        <SectionHeader :level="3">
          <Anchor :id="id ?? ''">
            {{ operation.name }}
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
            <OperationResponses :operation="operation" />
          </div>
        </SectionColumn>
        <SectionColumn>
          <div class="examples">
            <ScalarErrorBoundary>
              <ExampleRequest
                v-bind="exampleRequestProps"
                fallback
                :operation="operation">
                <template #header>
                  <OperationPath
                    class="example-path"
                    :deprecated="operation.information?.deprecated"
                    :path="operation.path" />
                </template>
                <template #footer>
                  <TestRequestButton :operation="operation" />
                </template>
              </ExampleRequest>
            </ScalarErrorBoundary>
            <ScalarErrorBoundary>
              <ExampleResponses
                :operation="operation"
                style="margin-top: 12px" />
            </ScalarErrorBoundary>
            <ExampleRequest
              v-bind="exampleRequestProps"
              fallback
              :operation="operation">
              <template #header>
                <OperationPath
                  class="example-path"
                  :deprecated="operation.information?.deprecated"
                  :path="operation.path" />
              </template>
              <template #footer>
                <TestRequestButton :operation="operation" />
              </template>
            </ExampleRequest>
            <ExampleResponses
              :operation="operation"
              style="margin-top: 12px" />
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
