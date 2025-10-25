<script setup lang="ts">
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
</script>
<template>
  <Lazy id="models">
    <!-- Modern Layout Model Container -->
    <SectionContainer
      v-if="options.layout === 'modern'"
      id="models">
      <Section
        aria-label="Models"
        @intersecting="(id) => emit('intersecting', id)">
        <SectionHeader>
          <SectionHeaderTag :level="2"> Models </SectionHeaderTag>
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
      aria-label="Models"
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
