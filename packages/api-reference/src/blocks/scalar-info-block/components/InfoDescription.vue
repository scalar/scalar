<script setup lang="ts">
import {
  getHeadings,
  isHeading,
  splitContent,
  textFromNode,
  type Node,
} from '@scalar/code-highlight/markdown'
import { slugger } from '@scalar/helpers/string/slugger'
import type { Heading } from '@scalar/types/legacy'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed } from 'vue'

import {
  EditableDescription,
  useEditableDescription,
} from '@/features/editable-description'

import InfoMarkdownSection from './InfoMarkdownSection.vue'

const { description, headingSlugGenerator, target } = defineProps<{
  eventBus: WorkspaceEventBus | null
  headingSlugGenerator: (heading: Heading) => string
  /** Markdown document */
  description?: string
  /** The info object the description belongs to, so it can be edited in place */
  target?: unknown
}>()

const { canEdit } = useEditableDescription()

/**
 * Descriptions, but split into multiple sections.
 * We need this to wrap the headings in IntersectionObserver components.
 */
const sections = computed(() => {
  if (!description) {
    return []
  }

  const { slug } = slugger()

  const items = splitContent(description).map((markdown) => {
    // Get “first” (and only) heading, if available
    const headings = getHeadings(markdown)
    const heading = headings[0]

    // Generate an id for the heading
    const id = heading
      ? headingSlugGenerator({
          ...heading,
          slug: slug(heading.value),
        })
      : undefined

    return {
      id,
      content: markdown,
    }
  })

  return items
})

/** Add ids to all headings */
const transformHeading = (node: Node) => {
  if (!isHeading(node)) {
    return node
  }

  const { slug } = slugger()

  const value = textFromNode(node)

  node.data = {
    hProperties: {
      id: headingSlugGenerator({
        depth: node.depth,
        value,
        slug: slug(value),
      }),
    },
  }

  return node
}
</script>

<template>
  <!-- The sections are only how the read view is split for navigation; the
       edit target is the whole description, so the editor wraps them all. -->
  <EditableDescription
    v-if="description || canEdit(target)"
    class="introduction-description mt-6 flex flex-col"
    :target="target"
    :value="description">
    <InfoMarkdownSection
      v-for="section in sections"
      :id="section.id"
      :key="section.id"
      :content="section.content"
      :eventBus="eventBus"
      :transformHeading="transformHeading" />
  </EditableDescription>
</template>

<style scoped>
.references-classic .introduction-description :deep(img) {
  max-width: 720px;
}
</style>
