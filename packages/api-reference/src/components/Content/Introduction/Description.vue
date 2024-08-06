<script setup lang="ts">
import {
  getMarkdownAst,
  getNodesOfType,
  splitContent,
} from '@scalar/code-highlight/markdown'
import { ScalarMarkdown } from '@scalar/components'
import GithubSlugger from 'github-slugger'
import { computed } from 'vue'

import { joinWithSlash } from '../../../helpers'
import { useNavState } from '../../../hooks'
import IntersectionObserver from '../../IntersectionObserver.vue'

const props = defineProps<{
  /** Markdown document */
  value?: string
}>()

/**
 * Descriptions, but split into multiple sections.
 * We need this to wrap the headings in IntersectionObserver components.
 */
const sections = computed(() => {
  if (!props.value) {
    return []
  }

  const sectionSlugger = new GithubSlugger()

  const ast = getMarkdownAst(props.value)

  const items = splitContent(ast).map((markdown) => {
    const currentAst = getMarkdownAst(markdown)

    const [heading] = getNodesOfType(currentAst, 'heading')

    return {
      heading: heading,
      id: heading
        ? getHeadingId({
            ...heading,
            slug: sectionSlugger.slug(heading.value),
          })
        : undefined,
      content: markdown,
    }
  })

  return items
})

const { getHeadingId, hash, isIntersectionEnabled, pathRouting } = useNavState()

function handleScroll(headingId = '') {
  if (!isIntersectionEnabled.value) return

  const newUrl = new URL(window.location.href)

  // If we are pathrouting, set path instead of hash
  if (pathRouting.value) {
    newUrl.pathname = joinWithSlash(pathRouting.value.basePath, headingId)
  } else {
    newUrl.hash = headingId
  }
  hash.value = headingId

  // We use replaceState so we don't trigger the url hash watcher and trigger a scroll
  // this is why we set the hash value directly
  window.history.replaceState({}, '', newUrl)
}

const slugger = new GithubSlugger()

/** Add ids to all headings */
const transformHeading = (node: Record<string, any>) => {
  node.data = {
    hProperties: {
      id: getHeadingId({
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
    v-if="value"
    class="introduction-description">
    <template
      v-for="(section, index) in sections"
      :key="index">
      <!-- heading -->
      <template v-if="section.content.startsWith('#')">
        <IntersectionObserver
          :id="section.id"
          class="introduction-description-heading"
          @intersecting="() => handleScroll(section.id)">
          <ScalarMarkdown
            :transform="transformHeading"
            transformType="heading"
            :value="section.content" />
        </IntersectionObserver>
      </template>
      <!-- everything else -->
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
  gap: 18px;
}
.references-classic .introduction-description :deep(img) {
  max-width: 720px;
}
</style>
