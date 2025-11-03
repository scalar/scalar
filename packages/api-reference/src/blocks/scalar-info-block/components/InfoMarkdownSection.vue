<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { useTemplateRef } from 'vue'

import { useIntersection } from '@/hooks/use-intersection'

const { eventBus, id } = defineProps<{
  id?: string
  content: string
  transformHeading: (node: Record<string, any>) => Record<string, any>
  eventBus: WorkspaceEventBus | null
}>()

const element = useTemplateRef<HTMLElement>('element')

useIntersection(element, () =>
  id ? eventBus?.emit('intersecting:nav-item', { id }) : undefined,
)
</script>

<template>
  <div
    ref="element"
    class="introduction-description-heading scroll-mt-16">
    <ScalarMarkdown
      :transform="transformHeading"
      transformType="heading"
      :value="content"
      withImages />
  </div>
</template>
