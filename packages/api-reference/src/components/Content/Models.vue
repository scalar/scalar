<script setup lang="ts">
import { computed } from 'vue'

import { getModelSectionId } from '../../helpers'
import { useTemplateStore } from '../../stores/template'
import { type Components } from '../../types'
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

const { state: templateState } = useTemplateStore()

const showAllModels = computed(
  () =>
    Object.keys(props.components?.schemas ?? {}).length <= 3 ||
    templateState.collapsedSidebarItems[getModelSectionId()],
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
  <SectionContainer
    v-if="components"
    :id="getModelSectionId()">
    <Section
      v-for="(name, index) in models"
      :id="getModelSectionId(name)"
      :key="name">
      <template v-if="components?.schemas?.[name]">
        <SectionHeader>
          {{ name }}
        </SectionHeader>
        <SectionContent>
          <!-- Schema -->
          <div class="section-columns">
            <!-- <div class="section-column"></div> -->
            <div class="section-column">
              <Schema :value="components?.schemas?.[name]" />
            </div>
          </div>
          <!-- Show More Button -->
          <ShowMoreButton
            v-if="!showAllModels && index === models.length - 1"
            :id="getModelSectionId()" />
        </SectionContent>
      </template>
    </Section>
  </SectionContainer>
</template>
<style>
.section-columns {
  display: flex;
  gap: 48px;
}

.references-narrow .section-columns {
  flex-direction: column;
}
.section-column {
  flex: 1;
  min-width: 0;
}
</style>
