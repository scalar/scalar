<script setup lang="ts">
import { getOperationSectionId } from '../../../helpers'
import type { Tag, TransformedOperation } from '../../../types'
import { Anchor } from '../../Anchor'
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
          <div
            v-if="operation.information?.deprecated"
            class="badge">
            Deprecated
          </div>
          <div :class="operation.information?.deprecated ? 'deprecated' : ''">
            <SectionHeader :level="3">
              <Anchor :id="getOperationSectionId(operation, tag)">
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

.badge {
  display: inline-block;
  padding: 2px 4px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  background: var(--theme-background-3, var(--default-theme-background-3));
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-size: var(--theme-micro, var(--default-theme-micro));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1em;
}

.deprecated * {
  text-decoration: line-through;
  color: var(--theme-color-2, var(--default-theme-color-2));
}
</style>
