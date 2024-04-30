<script setup lang="ts">
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-parser'
import { computed } from 'vue'

import { useNavState, useSidebar } from '../../../hooks'
import { Anchor } from '../../Anchor'
import {
  Section,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../../Section'
import ShowMoreButton from '../../ShowMoreButton.vue'
import { Lazy } from '../Lazy'
import { Schema } from '../Schema'

const props = defineProps<{
  schemas?:
    | OpenAPIV2.DefinitionsObject
    | Record<string, OpenAPIV3.SchemaObject>
    | Record<string, OpenAPIV3_1.SchemaObject>
    | unknown
}>()

const { collapsedSidebarItems } = useSidebar()
const { getModelId } = useNavState()

const showAllModels = computed(
  () =>
    Object.keys(props.schemas ?? {}).length <= 3 ||
    collapsedSidebarItems[getModelId()],
)

const models = computed(() => {
  const allModels = Object.keys(props.schemas ?? {})

  if (showAllModels.value) {
    return allModels
  }

  // return only first 3 models
  return allModels.slice(0, 3)
})
</script>
<template>
  <SectionContainer v-if="schemas">
    <!-- Just a cheap trick to jump down to models -->
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
      <Section
        :id="getModelId(name)"
        :label="name">
        <template v-if="(schemas as any)[name]">
          <SectionContent>
            <SectionHeader :level="2">
              <Anchor :id="getModelId(name)">
                {{ (schemas as any)[name].title ?? name }}
              </Anchor>
            </SectionHeader>
            <!-- Schema -->
            <Schema
              :name="name"
              noncollapsible
              :value="(schemas as any)[name]" />
            <!-- Show More Button -->
            <ShowMoreButton
              v-if="!showAllModels && index === models.length - 1"
              :id="getModelId()"
              class="something-special" />
          </SectionContent>
        </template>
      </Section>
    </Lazy>
  </SectionContainer>
</template>
<style scoped>
.show-more {
  margin-top: 24px;
}
</style>
