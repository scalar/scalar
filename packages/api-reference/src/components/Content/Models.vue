<script setup lang="ts">
import { computed } from 'vue'

import { useNavState, useSidebar } from '../../hooks'
import { type Components } from '../../types'
import { Anchor } from '../Anchor'
import {
  Section,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../Section'
import Schema from './Schema.vue'
import ShowMoreButton from './ShowMoreButton.vue'

const props = defineProps<{
  components?: Components
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
    <Section
      v-for="(name, index) in models"
      :id="getModelId(name)"
      :key="name"
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
            :value="components?.schemas?.[name]" />
          <!-- Show More Button -->
          <ShowMoreButton
            v-if="!showAllModels && index === models.length - 1"
            :id="getModelId()"
            class="something-special" />
        </SectionContent>
      </template>
    </Section>
  </SectionContainer>
</template>
<style scoped>
.show-more {
  margin-top: 24px;
}
</style>
