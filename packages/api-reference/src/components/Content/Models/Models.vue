<script setup lang="ts">
import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-parser'
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
  components?: OpenAPIV3.ComponentsObject | OpenAPIV3_1.ComponentsObject
}>()

const { collapsedSidebarItems } = useSidebar()
const { getModelId } = useNavState()

const showAllModels = computed(
  () =>
    Object.keys(props.components?.schemas ?? {}).length <= 3 ||
    collapsedSidebarItems[getModelId()],
)

const models = computed(() => {
  const allModels = Object.keys(props.components?.schemas ?? {})

  if (showAllModels.value) {
    return allModels
  }

  // return only first 3 models
  return allModels.slice(0, 3)
})
</script>
<template>
  <SectionContainer v-if="components">
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
        <template v-if="components?.schemas?.[name]">
          <SectionContent>
            <SectionHeader :level="2">
              <Anchor :id="getModelId(name)">
                {{ (components?.schemas?.[name] as any).title ?? name }}
              </Anchor>
            </SectionHeader>
            <!-- Schema -->
            <Schema
              :name="name"
              noncollapsible
              :value="components?.schemas?.[name]" />
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
