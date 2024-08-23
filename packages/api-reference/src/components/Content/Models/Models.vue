<script setup lang="ts">
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-parser'
import { computed } from 'vue'

import { useNavState, useSidebar } from '../../../hooks'
import { Section, SectionContainer, SectionHeader } from '../../Section'
import ShowMoreButton from '../../ShowMoreButton.vue'
import { Lazy } from '../Lazy'
import CollapsedModel from './CollapsedModel.vue'

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
  <SectionContainer v-if="schemas">
    <Section>
      <!-- Just a cheap trick to jump down to models -->
      <SectionHeader :level="2">Models</SectionHeader>
      <Lazy
        id="models"
        :isLazy="false">
        <div id="models" />
      </Lazy>
      <Lazy
        v-for="(name, index) in models"
        :id="getModelId(name)"
        :key="name"
        isLazy>
        <CollapsedModel
          :name="name"
          :schemas="schemas" />
        <ShowMoreButton
          v-if="!showAllModels && index === models.length - 1"
          :id="getModelId()" />
      </Lazy>
    </Section>
  </SectionContainer>
</template>
<style scoped>
.show-more {
  margin-top: 24px;
}
</style>
