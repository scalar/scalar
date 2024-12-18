<script setup lang="ts">
import { getLocation } from '@/blocks'
import { useBlockProps } from '@/blocks/hooks/useBlockProps'
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
import { WORKSPACE_SYMBOL } from '@scalar/api-client/store'
import { ScalarErrorBoundary, ScalarMarkdown } from '@scalar/components'
import type { TransformedOperation } from '@scalar/types'
import { computed, inject } from 'vue'

import OperationParameters from '../components/OperationParameters.vue'
import OperationResponses from '../components/OperationResponses.vue'

const {
  id,
  request,
  secretCredentials,
  operation: transformedOperation,
} = defineProps<{
  id?: string
  operation: TransformedOperation | null
  request: Request | null
  secretCredentials: string[]
}>()

const store = inject(WORKSPACE_SYMBOL)

// TODO: Take the store as a prop, not a transformed operation
const { operation } = useBlockProps({
  // @ts-expect-error TODO: fix this
  store,
  location: getLocation(
    // @ts-expect-error TODO: fix this (has CONNECT method?)
    transformedOperation?.httpVerb ?? 'get',
    transformedOperation?.path ?? '',
  ),
})

const title = computed(
  () => operation.value?.summary || operation.value?.path || '',
)
</script>
<template>
  <Section
    v-if="operation"
    :id="id"
    :label="title">
    <SectionContent>
      <Badge v-if="operation.deprecated"> Deprecated </Badge>
      <div :class="operation.deprecated ? 'deprecated' : ''">
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
            <OperationResponses :operation="operation" />
          </div>
        </SectionColumn>
        <SectionColumn>
          <div class="examples">
            <ScalarErrorBoundary>
              <ExampleRequest
                fallback
                :operation="operation"
                :request="request"
                :secretCredentials="secretCredentials">
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
                :operation="operation"
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
