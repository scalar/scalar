<script setup lang="ts">
import { getOperationHash } from '../../../hooks'
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
    :id="getOperationHash(operation, tag)"
    :label="operation.name">
    <SectionContent>
      <SectionColumns>
        <SectionColumn>
          <Badge v-if="operation.information?.deprecated"> Deprecated </Badge>
          <div :class="operation.information?.deprecated ? 'deprecated' : ''">
            <SectionHeader :level="3">
              <Anchor :id="getOperationHash(operation, tag)">
                {{ operation.name }}
              </Anchor>
            </SectionHeader>
          </div>
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

.deprecated * {
  text-decoration: line-through;
}
</style>
