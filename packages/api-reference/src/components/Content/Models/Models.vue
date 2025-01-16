<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed } from 'vue'

import { useNavState, useSidebar } from '../../../hooks'
import {
  CompactSection,
  Section,
  SectionContainer,
  SectionHeader,
} from '../../Section'
import ShowMoreButton from '../../ShowMoreButton.vue'
import { Lazy } from '../Lazy'
import { Schema, SchemaHeading } from '../Schema'

const props = defineProps<{
  schemas?:
    | OpenAPIV2.DefinitionsObject
    | Record<string, OpenAPIV3.SchemaObject>
    | Record<string, OpenAPIV3_1.SchemaObject>
    | unknown
}>()

const MAX_MODELS_INITIALLY_SHOWN = 10

const { collapsedSidebarItems } = useSidebar()
const { getModelId } = useNavState()

const showAllModels = computed(
  () =>
    Object.keys(props.schemas ?? {}).length <= MAX_MODELS_INITIALLY_SHOWN ||
    collapsedSidebarItems[getModelId()],
)

const models = computed(() => {
  const allModels = Object.keys(props.schemas ?? {})

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
    <Section>
      <SectionHeader :level="2">Models</SectionHeader>
      <Lazy
        id="models"
        :isLazy="false">
      </Lazy>
      <div
        class="models-list"
        :class="{ 'models-list-truncated': !showAllModels }">
        <Lazy
          v-for="name in models"
          :id="getModelId({ name })"
          :key="name"
          isLazy>
          <CompactSection
            :id="getModelId({ name })"
            class="models-list-item"
            :label="name">
            <template #heading>
              <SchemaHeading
                :name="name"
                :value="(schemas as any)[name]" />
            </template>
            <ScalarErrorBoundary>
              <Schema
                :hideHeading="true"
                noncollapsible
                :value="(schemas as any)[name]" />
            </ScalarErrorBoundary>
          </CompactSection>
        </Lazy>
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
</style>
