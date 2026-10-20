<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, useTemplateRef } from 'vue'

import { Anchor } from '@/components/Anchor'
import {
  CompactSection,
  SectionAccordion,
  SectionHeaderTag,
} from '@/components/Section'
import { useDocumentOutline } from '@/features/document-outline'
import { useIntersection } from '@/hooks/use-intersection'

import SchemaSource from './SchemaSource.vue'

const { id, name, format, value, layout, isCollapsed, eventBus } = defineProps<{
  id: string
  name: string
  format: string
  value: unknown
  layout: 'classic' | 'modern'
  isCollapsed: boolean
  eventBus: WorkspaceEventBus
}>()

const section = useTemplateRef<HTMLElement>('section')
useIntersection(section, () => eventBus?.emit('intersecting:nav-item', { id }))
const { level: headingLevel } = useDocumentOutline('model')
const headingSlot = computed(() => (layout === 'modern' ? 'heading' : 'title'))
const copyAnchor = (): void => {
  eventBus?.emit('copy-url:nav-item', { id })
}
const toggle = (open: boolean): void => {
  eventBus?.emit('toggle:nav-item', { id, open })
}
</script>

<template>
  <div ref="section">
    <component
      :is="layout === 'modern' ? CompactSection : SectionAccordion"
      :id="id"
      :label="name"
      :modelValue="!isCollapsed"
      @copyAnchorUrl="copyAnchor"
      @update:modelValue="toggle">
      <template #[headingSlot]>
        <Anchor
          v-if="layout === 'classic'"
          @copyAnchorUrl="copyAnchor">
          <SectionHeaderTag :level="headingLevel">
            <span>{{ name }}</span>
          </SectionHeaderTag>
        </Anchor>
        <SectionHeaderTag
          v-else
          :level="headingLevel">
          <span>{{ name }}</span>
        </SectionHeaderTag>
      </template>
      <SchemaSource
        :format="format"
        :value="value" />
    </component>
  </div>
</template>
