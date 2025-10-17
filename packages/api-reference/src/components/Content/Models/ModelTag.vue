<script setup lang="ts">
import { useId } from 'vue'

import Lazy from '@/components/Lazy/Lazy.vue'
import { Section, SectionHeader } from '@/components/Section'
import SectionContainer from '@/components/Section/SectionContainer.vue'
import SectionContainerAccordion from '@/components/Section/SectionContainerAccordion.vue'
import SectionHeaderTag from '@/components/Section/SectionHeaderTag.vue'
import ShowMoreButton from '@/components/ShowMoreButton.vue'

defineProps<{
  id: string
  isCollapsed: boolean
  options: {
    layout: 'classic' | 'modern'
    expandAllModelSections: boolean | undefined
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()

const emit = defineEmits<{
  (e: 'toggleTag', id: string, open: boolean): void
  (e: 'intersecting', id: string): void
}>()

/** UID used to associate the section header with the section content */
const headerId = useId()
</script>
<template>
  <Lazy id="models">
    <!-- Modern Layout Model Container -->
    <SectionContainer
      v-if="options.layout === 'modern'"
      id="models">
      <Section
        :aria-labelledby="headerId"
        @intersecting="(id) => emit('intersecting', id)">
        <SectionHeader>
          <SectionHeaderTag
            :id="headerId"
            :level="2">
            Models
          </SectionHeaderTag>
        </SectionHeader>
        <template v-if="!isCollapsed">
          <slot />
        </template>
        <template v-else>
          <ShowMoreButton
            :id="id"
            class="top-0"
            @click="() => emit('toggleTag', id, true)">
          </ShowMoreButton>
        </template>
      </Section>
    </SectionContainer>
    <!-- Classic Layout Model Container -->
    <SectionContainerAccordion
      v-else
      class="pb-12"
      :modelValue="!isCollapsed"
      @update:modelValue="() => emit('toggleTag', id, isCollapsed)">
      <template #title>
        <SectionHeader :level="2">Models</SectionHeader>
      </template>
      <slot />
    </SectionContainerAccordion>
  </Lazy>
</template>
