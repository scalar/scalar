<script setup lang="ts">
import { getOperationSectionId } from '../../../helpers'
import type { Tag, TransformedOperation } from '../../../types'
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
          <SectionHeader :level="3">
            {{ operation.name }}
          </SectionHeader>
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
  </Section>
</template>

<style scoped>
.examples {
  position: sticky;
  top: calc(var(--refs-header-height) + 24px);
}
</style>
