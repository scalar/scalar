<script setup lang="ts">
import type { TransformedOperation } from '@scalar/oas-utils'
import { computed } from 'vue'

import { Anchor } from '../../Anchor'
import { Badge } from '../../Badge'
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
  id?: string
  operation: TransformedOperation
}>()

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
    :id="id"
    class="section-example"
    :label="operation.name">
    <SectionContent>
      <Badge v-if="operation.information?.deprecated"> Deprecated </Badge>
      <div
        class="section-header-sticky"
        :class="operation.information?.deprecated ? 'deprecated' : ''">
        <SectionHeader
          class="section-header--3"
          :level="3">
          <Anchor :id="id ?? ''">
            {{ operation.name }}
          </Anchor>
        </SectionHeader>
        <TryRequestButton :operation="operation" />
      </div>
      <SectionColumns>
        <SectionColumn>
          <EndpointDetails :operation="operation" />
        </SectionColumn>
        <SectionColumn>
          <div class="examples">
            <CustomRequestExamples
              v-if="customRequestExamples"
              :examples="customRequestExamples"
              :operation="operation">
              <template #header>
                <EndpointPath
                  class="example-path"
                  :deprecated="operation.information?.deprecated"
                  :path="operation.path" />
              </template>
            </CustomRequestExamples>
            <ExampleRequest
              v-else
              :operation="operation">
              <template #header>
                <EndpointPath
                  class="example-path"
                  :deprecated="operation.information?.deprecated"
                  :path="operation.path" />
              </template>
            </ExampleRequest>
            <PathResponses
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
  top: calc(var(--refs-header-height) + 64px);
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
.section-header-sticky {
  position: sticky;
  top: calc(var(--refs-header-height) - 0.01px);
  background: var(--theme-background-1, var(--default-theme-background-1));
  z-index: 10;
  padding: 12px 0;
  display: flex;
  justify-content: space-between;
}
.section-header-sticky:after {
  content: '';
  position: absolute;
  bottom: 0;
  width: calc(100vw - var(--theme-sidebar-width, 280px));
  right: -60px;
  height: calc(100% + var(--refs-header-height) + 0.01px);
  animation: stickyscrollanimation linear;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
  animation-timeline: view(block);
  animation-range: entry-crossing 100% exit-crossing 0%;
  animation-timing-function: steps(1, end);
  border-bottom: 1px solid transparent;
  pointer-events: none;
}
@keyframes stickyscrollanimation {
  exit 0% {
    border-bottom-color: var(
      --theme-border-color,
      var(--default-theme-border-color)
    );
  }
  exit 100% {
    border-bottom-color: var(
      --theme-border-color,
      var(--default-theme-border-color)
    );
  }
}
.section-example :deep(.section-column:nth-of-type(2)) {
  padding-top: 12px;
}
</style>
