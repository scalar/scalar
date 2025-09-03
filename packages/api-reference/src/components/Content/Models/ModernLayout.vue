<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed, useId } from 'vue'

import { Lazy } from '@/components/Lazy'
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

const { config, schemas } = defineProps<{
  config: ApiReferenceConfiguration
  schemas?: Record<string, OpenAPIV3_1.SchemaObject>
}>()

const headerId = useId()

const MAX_MODELS_INITIALLY_SHOWN = 10

const { collapsedSidebarItems } = useSidebar()
const { getModelId } = useNavState()

const showAllModels = computed(
  () =>
    config.expandAllModelSections ||
    Object.keys(schemas ?? {}).length <= MAX_MODELS_INITIALLY_SHOWN ||
    collapsedSidebarItems[getModelId()],
)

const models = computed(() => {
  const allModels = Object.keys(schemas ?? {})

  if (showAllModels.value) {
    return allModels
  }

  // return only first MAX_MODELS_INITIALLY_SHOWN models
  return allModels.slice(0, MAX_MODELS_INITIALLY_SHOWN)
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
        <template
          v-for="name in models"
          :key="name">
          <Lazy :id="getModelId({ name })">
            <CompactSection
              :id="getModelId({ name })"
              class="models-list-item"
              :defaultOpen="config.expandAllModelSections"
              :label="name">
              <template #heading>
                <SectionHeaderTag :level="3">
                  <SchemaHeading
                    :name="schemas[name].title ?? name"
                    :value="schemas[name]" />
                </SectionHeaderTag>
              </template>
              <ScalarErrorBoundary>
                <Schema
                  :hideHeading="true"
                  :hideModelNames="true"
                  :level="1"
                  noncollapsible
                  :schemas="schemas"
                  :value="schemas[name]" />
              </ScalarErrorBoundary>
            </CompactSection>
          </Lazy>
        </template>
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
