<script setup lang="ts">
import { getOperationSectionId } from '../../../helpers'
import type { Tag, TransformedOperation } from '../../../types'
import { Anchor } from '../../Anchor'
import {
  SectionAccordion,
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
  tag: Tag
}>()
</script>
<template>
  <SectionAccordion :id="getOperationSectionId(operation, tag)">
    <template #title>
      <SectionHeader :level="3">
        <Anchor :id="getOperationSectionId(operation, tag)">
          {{ operation.name }}
        </Anchor>
      </SectionHeader>
    </template>
    <SectionContent>
      <SectionColumns>
        <SectionColumn>
          <Copy :operation="operation" />
        </SectionColumn>
        <SectionColumn>
          <div class="examples">
            <ExampleRequest :operation="operation" />
            <ExampleResponses
              :operation="operation"
              style="margin-top: 12px" />
          </div>
        </SectionColumn>
      </SectionColumns>
    </SectionContent>
  </SectionAccordion>
</template>

<style scoped>
.examples {
  position: sticky;
  top: calc(var(--refs-header-height) + 24px);
}
</style>
