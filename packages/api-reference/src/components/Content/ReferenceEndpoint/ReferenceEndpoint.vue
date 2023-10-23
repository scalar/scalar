<script setup lang="ts">
import { getOperationSectionId } from '../../../helpers'
import type { Server, Spec, Tag, TransformedOperation } from '../../../types'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
} from '../../Section'
import Copy from './Copy.vue'
import ExampleRequest from './ExampleRequest.vue'
import { ExampleResponses } from './ExampleResponses'

defineProps<{
  operation: TransformedOperation
  server: Server
  spec: Spec
  tag: Tag
}>()
</script>
<template>
  <Section
    :id="getOperationSectionId(operation, tag)"
    :label="operation.name || operation.path">
    <SectionContent>
      <SectionColumns>
        <SectionColumn>
          <SectionHeader>
            {{ operation.name || operation.path }}
          </SectionHeader>
          <Copy :operation="operation" />
        </SectionColumn>
        <SectionColumn>
          <div class="examples">
            <ExampleRequest
              :operation="operation"
              :server="server"
              :spec="spec" />
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
  top: 24px;
}
</style>
