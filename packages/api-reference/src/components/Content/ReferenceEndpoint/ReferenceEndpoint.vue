<script setup lang="ts">
import { computed } from 'vue'

import { useNavState } from '../../../hooks'
import type { Tag, TransformedOperation } from '../../../types'
import { Anchor } from '../../Anchor'
import { Badge } from '../../Badge'
import Lazy from '../../Lazy.vue'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
} from '../../Section'
import CustomRequestExamples from './CustomRequestExamples.vue'
import EndpointDetails from './EndpointDetails.vue'
import EndpointPath from './EndpointPath.vue'
import ExampleRequest from './ExampleRequest.vue'
import { PathResponses } from './PathResponses'
import TryRequestButton from './TryRequestButton.vue'

const props = defineProps<{
  operation: TransformedOperation
  tag: Tag
  isLazy: boolean
}>()

const { getOperationId } = useNavState()

const customRequestExamples = computed(() => {
  const keys = ['x-custom-examples', 'x-codeSamples', 'x-code-samples']

  for (const key of keys) {
    if (
      props.operation.information?.[
        key as 'x-custom-examples' | 'x-codeSamples' | 'x-code-samples'
      ]
    ) {
      return props.operation.information[
        key as 'x-custom-examples' | 'x-codeSamples' | 'x-code-samples'
      ]
    }
  }

  return null
})
</script>
<template>
  <Section
    :id="getOperationId(operation, tag)"
    :label="operation.name">
    <SectionContent>
      <SectionColumns>
        <SectionColumn>
          <Badge v-if="operation.information?.deprecated"> Deprecated </Badge>
          <div :class="operation.information?.deprecated ? 'deprecated' : ''">
            <SectionHeader :level="3">
              <Anchor :id="getOperationId(operation, tag)">
                {{ operation.name }}
              </Anchor>
            </SectionHeader>
          </div>
          <Lazy :isLazy="isLazy">
            <EndpointDetails :operation="operation" />
          </Lazy>
        </SectionColumn>
        <Lazy :isLazy="isLazy">
          <SectionColumn>
            <div class="examples">
              <CustomRequestExamples
                v-if="customRequestExamples"
                :examples="customRequestExamples"
                :operation="operation">
                <template #header>
                  <EndpointPath
                    class="example-path"
                    :path="operation.path" />
                </template>
                <template #footer>
                  <TryRequestButton :operation="operation" />
                </template>
              </CustomRequestExamples>
              <ExampleRequest
                v-else
                :operation="operation">
                <template #header> </template>
                <template #footer>
                  <TryRequestButton :operation="operation" />
                </template>
              </ExampleRequest>
              <PathResponses
                :operation="operation"
                style="margin-top: 12px" />
            </div>
          </SectionColumn>
        </Lazy>
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
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}
.example-path :deep(em) {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
</style>
