<script setup lang="ts">
import {
  DEFAULT_MODELS_SECTION_LABEL,
  type ModelsSectionLabel,
} from '@scalar/types/api-reference'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'

import { Section, SectionHeader } from '@/components/Section'
import SectionContainer from '@/components/Section/SectionContainer.vue'
import SectionContainerAccordion from '@/components/Section/SectionContainerAccordion.vue'
import SectionHeaderTag from '@/components/Section/SectionHeaderTag.vue'
import ShowMoreButton from '@/components/ShowMoreButton.vue'
import { useDocumentOutline } from '@/features/document-outline'
import { useLocalization } from '@/features/localization'

const {
  id,
  eventBus,
  modelsSectionLabel = DEFAULT_MODELS_SECTION_LABEL,
} = defineProps<{
  id: string
  isCollapsed: boolean
  eventBus: WorkspaceEventBus
  layout: 'classic' | 'modern'
  modelsSectionLabel?: ModelsSectionLabel
}>()

const { level: headingLevel } = useDocumentOutline('modelGroup')
const { translate } = useLocalization()

const openSection = (event: MouseEvent): void => {
  const button = event.currentTarget
  if (button instanceof HTMLElement && button.matches(':focus')) {
    // Keep keyboard focus in the section when its Show More button disappears.
    button.closest('section')?.focus({ preventScroll: true })
  }
  eventBus.emit('toggle:nav-item', { id, open: true })
}
</script>
<template>
  <!-- Modern Layout Model Container -->
  <SectionContainer v-if="layout === 'modern'">
    <Section
      :id="id"
      :aria-label="modelsSectionLabel"
      tabindex="-1"
      @intersecting="() => eventBus?.emit('intersecting:nav-item', { id })">
      <SectionHeader>
        <SectionHeaderTag :level="headingLevel">
          {{ modelsSectionLabel }}
        </SectionHeaderTag>
      </SectionHeader>
      <template v-if="!isCollapsed">
        <slot />
      </template>
      <template v-else>
        <ShowMoreButton
          :aria-label="`${translate('actions.showMore')} ${modelsSectionLabel}`"
          class="top-0"
          @click="openSection" />
      </template>
    </Section>
  </SectionContainer>
  <!-- Classic Layout Model Container -->
  <SectionContainerAccordion
    v-else
    :id="id"
    :aria-label="modelsSectionLabel"
    class="scroll-mt-(--refs-viewport-offset) pb-12"
    :modelValue="!isCollapsed"
    tabindex="-1"
    @update:modelValue="
      (open) => eventBus?.emit('toggle:nav-item', { id, open })
    ">
    <template #title>
      <SectionHeader>
        <SectionHeaderTag :level="headingLevel">
          {{ modelsSectionLabel }}
        </SectionHeaderTag>
      </SectionHeader>
    </template>
    <slot />
  </SectionContainerAccordion>
</template>
