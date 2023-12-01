<script setup lang="ts">
import { getOperationSectionId } from '../../../helpers'
import type { Tag, TransformedOperation } from '../../../types'
import { Anchor } from '../../Anchor'
import { SectionAccordion } from '../../Section'
import MarkdownRenderer from '../MarkdownRenderer.vue'
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
      <h3 class="endpoint-header">
        <div class="endpoint-details">
          <span class="endpoint-type">{{ operation.httpVerb }}</span>
          <Anchor
            :id="getOperationSectionId(operation, tag)"
            class="endpoint-anchor">
            <div class="endpoint-label">
              <div class="endpoint-label-path">{{ operation.path }}</div>
              <div class="endpoint-label-name">{{ operation.name }}</div>
            </div>
          </Anchor>
        </div>
      </h3>
    </template>
    <template #description>
      <MarkdownRenderer :value="operation.description" />
    </template>
    <div>
      <Copy :operation="operation" />
      <ExampleResponses :operation="operation" />
      <ExampleRequest :operation="operation" />
    </div>
  </SectionAccordion>
</template>

<style scoped>
.endpoint-header {
  display: flex;
  justify-content: space-between;
}
.endpoint-details {
  display: flex;
  align-items: center;
  gap: 12px;
}
.endpoint-type {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  width: 70px;
  padding: 6px;

  font-size: var(--theme-micro, var(--default-theme-micro));

  text-transform: uppercase;
  font-family: var(--default-theme-font-code);
  background: var(--theme-background-3, var(--default-theme-background-3));
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
.endpoint-type::before {
  display: inline-block;
  content: '';
  background: currentColor;
  border-radius: 9999px;
  width: 10px;
  aspect-ratio: 1 /1;
}

.endpoint-anchor {
  display: flex;
  align-items: center;

  font-size: 20px;
}

.endpoint-label {
  display: flex;
  gap: 9px;
}

.endpoint-label-path {
  font-family: var(--default-theme-font-code);
  font-size: var(--theme-mini, var(--default-theme-mini));
}
.endpoint-label-name {
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-size: var(--theme-micro, var(--default-theme-micro));
}
</style>
