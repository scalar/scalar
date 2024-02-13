<script setup lang="ts">
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { computed } from 'vue'

import { useNavState, useSidebar } from '../../hooks'
import { Anchor } from '../Anchor'
import Lazy from '../Lazy.vue'
import {
  Section,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../Section'
import Schema from './Schema.vue'
import ShowMoreButton from './ShowMoreButton.vue'

const props = defineProps<{
  components?: OpenAPIV3.ComponentsObject | OpenAPIV3_1.ComponentsObject
}>()

const { collapsedSidebarItems } = useSidebar()
const { getModelId, hash } = useNavState()

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

let lazyIndexModel = 4

if (hash.value) {
  const [, modelName] = hash.value.split('/')
  const modelIndex = models.value.findIndex(
    (name) => name.toLowerCase() === modelName,
  )
  lazyIndexModel = modelIndex + 1
}
</script>
<template>
  <SectionContainer v-if="components">
    <template
      v-for="(name, index) in models"
      :key="name">
      <Lazy
        :id="getModelId(name)"
        :isLazy="index > lazyIndexModel">
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
    </template>
  </SectionContainer>
</template>
<style scoped>
.show-more {
  margin-top: 24px;
}
</style>
