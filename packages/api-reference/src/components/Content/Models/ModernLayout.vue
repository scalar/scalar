<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'
import { computed, useId } from 'vue'

import {
  CompactSection,
  Section,
  SectionContainer,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import ShowMoreButton from '@/components/ShowMoreButton.vue'
import { useSidebar } from '@/features/sidebar'
import { useNavState } from '@/hooks/useNavState'

import { Schema, SchemaHeading } from '../Schema'

const { schemas = [] } = defineProps<{
  schemas: { name: string; schema: SchemaObject }[]
}>()

const headerId = useId()

const MAX_MODELS_INITIALLY_SHOWN = 10

const { collapsedSidebarItems } = useSidebar()
const { getModelId } = useNavState()

const showAllModels = computed(
  () =>
    schemas.length <= MAX_MODELS_INITIALLY_SHOWN ||
    collapsedSidebarItems[getModelId()],
)

const models = computed(() => {
  if (showAllModels.value) {
    return schemas
  }

  // return only first MAX_MODELS_INITIALLY_SHOWN models
  return schemas.slice(0, MAX_MODELS_INITIALLY_SHOWN)
})
</script>
<template>
  <SectionContainer
    v-if="schemas"
    id="models">
    <Section :aria-labelledby="headerId">
      <SectionHeader>
        <SectionHeaderTag
          :id="headerId"
          :level="2">
          Models
        </SectionHeaderTag>
      </SectionHeader>
      <div
        class="models-list"
        :class="{ 'models-list-truncated': !showAllModels }">
        <CompactSection
          v-for="{ name, schema } in models"
          :key="name"
          :id="getModelId({ name })"
          :label="name"
          class="models-list-item">
          <template #heading>
            <SectionHeaderTag :level="3">
              <SchemaHeading
                :name="schema.title ?? name"
                :value="schema" />
            </SectionHeaderTag>
          </template>
          <ScalarErrorBoundary>
            <Schema
              noncollapsible
              :hideHeading="true"
              :hideModelNames="true"
              :level="1"
              :value="schema" />
          </ScalarErrorBoundary>
        </CompactSection>
      </div>
      <ShowMoreButton
        v-if="!showAllModels"
        :id="getModelId()"
        class="show-more-models" />
    </Section>
  </SectionContainer>
</template>
<style scoped>
.models-list {
  display: contents;
}
.models-list-truncated .models-list-item:last-child {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.show-more-models {
  margin-top: 32px;
  top: 0px;
}
/* increase z-index for hover of examples */
.models-list-item:hover {
  z-index: 10;
}
</style>
