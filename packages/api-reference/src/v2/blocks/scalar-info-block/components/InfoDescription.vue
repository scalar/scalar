<script setup lang="ts">
import { getHeadings, splitContent } from '@scalar/code-highlight/markdown'
import { ScalarMarkdown } from '@scalar/components'
import type { Heading } from '@scalar/types'
import GitHubSlugger from 'github-slugger'
import { computed } from 'vue'

import IntersectionObserver from '@/components/IntersectionObserver.vue'

const { description, headingSlugGenerator } = defineProps<{
  headingSlugGenerator: (heading: Heading) => string
  /** Markdown document */
  description?: string
}>()

const emit = defineEmits<{
  (e: 'intersecting', id: string): void
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

const slugger = new GitHubSlugger()

/** Add ids to all headings */
const transformHeading = (node: Record<string, any>) => {
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
    class="introduction-description">
    <template
      v-for="section in sections"
      :key="section.id">
      <!-- Headings -->
      <template v-if="section.id">
        <IntersectionObserver
          :id="section.id"
          class="introduction-description-heading"
          @intersecting="(id) => emit('intersecting', id)">
          <ScalarMarkdown
            :transform="transformHeading"
            transformType="heading"
            :value="section.content" />
        </IntersectionObserver>
      </template>
      <!-- Everything else -->
      <template v-else>
        <ScalarMarkdown
          :value="section.content"
          withImages />
      </template>
    </template>
  </div>
</template>

<style scoped>
.introduction-description-heading {
  scroll-margin-top: 64px;
}

.introduction-description {
  display: flex;
  flex-direction: column;
  margin-top: 24px;
}
.references-classic .introduction-description :deep(img) {
  max-width: 720px;
}
</style>
