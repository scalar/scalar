<script setup lang="ts">
import { getHeadings, splitContent } from '@scalar/code-highlight/markdown'
import type { Heading } from '@scalar/types'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import GitHubSlugger from 'github-slugger'
import { computed } from 'vue'

import InfoMarkdownSection from './InfoMarkdownSection.vue'

const { description, headingSlugGenerator } = defineProps<{
  eventBus: WorkspaceEventBus | null
  headingSlugGenerator: (heading: Heading) => string
  /** Markdown document */
  description?: string
}>()

/**
 * Descriptions, but split into multiple sections.
 * We need this to wrap the headings in IntersectionObserver components.
 */
const sections = computed(() => {
  if (!description) {
    return []
  }

  const slugger = new GitHubSlugger()

  const items = splitContent(description).map((markdown) => {
    // Get “first” (and only) heading, if available
    const headings = getHeadings(markdown)
    const heading = headings[0]

    // Generate an id for the heading
    const id = heading
      ? headingSlugGenerator({
          ...heading,
          slug: slugger.slug(heading.value),
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
const transformHeading = (node: Record<string, any>) => {
  const slugger = new GitHubSlugger()

  node.data = {
    hProperties: {
      id: headingSlugGenerator({
        depth: node.depth,
        value: node.children[0].value,
        slug: slugger.slug(node.children[0].value),
      }),
    },
  }

  return node
}
</script>

<template>
  <div
    v-if="description"
    class="introduction-description mt-6 flex flex-col">
    <InfoMarkdownSection
      v-for="section in sections"
      :id="section.id"
      :key="section.id"
      :content="section.content"
      :eventBus="eventBus"
      :transformHeading="transformHeading" />
  </div>
</template>

<style scoped>
.references-classic .introduction-description :deep(img) {
  max-width: 720px;
}
</style>
