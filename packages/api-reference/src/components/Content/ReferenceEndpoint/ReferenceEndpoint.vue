<script setup lang="ts">
import { getOperationSectionId } from '../../../helpers'
import type { Tag, TransformedOperation } from '../../../types'
import { Anchor } from '../../Anchor'
import { Badge } from '../../Badge'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
} from '../../Section'
import EndpointDetails from './EndpointDetails.vue'
import EndpointPath from './EndpointPath.vue'
import ExampleRequest from './ExampleRequest.vue'
import { ResponseSchema } from './ResponseSchema'
import TryRequestButton from './TryRequestButton.vue'

defineProps<{
  operation: TransformedOperation
  tag: Tag
}>()
</script>
<template>
  <Section
    :id="getOperationSectionId(operation, tag)"
    :label="operation.name">
    <SectionContent>
      <SectionColumns>
        <SectionColumn>
          <Badge v-if="operation.information?.deprecated"> Deprecated </Badge>
          <div :class="operation.information?.deprecated ? 'deprecated' : ''">
            <SectionHeader :level="3">
              <Anchor :id="getOperationSectionId(operation, tag)">
                {{ operation.name }}
              </Anchor>
            </SectionHeader>
          </div>
          <EndpointDetails :operation="operation" />
        </SectionColumn>
        <SectionColumn>
          <div class="examples">
            <ExampleRequest :operation="operation">
              <template #header>
                <EndpointPath
                  class="example-path"
                  :path="operation.path" />
              </template>
              <template #footer>
                <TryRequestButton :operation="operation" />
              </template>
            </ExampleRequest>
            <ResponseSchema
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
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}
.example-path :deep(em) {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
</style>
