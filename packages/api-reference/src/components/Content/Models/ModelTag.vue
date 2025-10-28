<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'

import Lazy from '@/components/Lazy/Lazy.vue'
import { Section, SectionHeader } from '@/components/Section'
import SectionContainer from '@/components/Section/SectionContainer.vue'
import SectionContainerAccordion from '@/components/Section/SectionContainerAccordion.vue'
import SectionHeaderTag from '@/components/Section/SectionHeaderTag.vue'
import ShowMoreButton from '@/components/ShowMoreButton.vue'

defineProps<{
  id: string
  isCollapsed: boolean
  eventBus: WorkspaceEventBus | null
  options: {
    layout: 'classic' | 'modern'
    expandAllModelSections: boolean | undefined
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()
</script>
<template>
  <Lazy id="models">
    <!-- Modern Layout Model Container -->
    <SectionContainer
      v-if="options.layout === 'modern'"
      id="model">
      <Section
        :id="id"
        aria-label="Models"
        @intersecting="() => eventBus?.emit('intersecting:nav-item', { id })">
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
            @click="
              () => eventBus?.emit('toggle:nav-item', { id, open: true })
            ">
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
      @update:modelValue="
        () => eventBus?.emit('toggle:nav-item', { id, open: isCollapsed })
      ">
      <template #title>
        <SectionHeader :level="2">Models</SectionHeader>
      </template>
      <slot />
    </SectionContainerAccordion>
  </Lazy>
</template>
