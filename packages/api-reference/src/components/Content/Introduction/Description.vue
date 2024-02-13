<script setup lang="ts">
import { computedAsync } from '@vueuse/core'

import {
  getHeadingsFromMarkdown,
  getLowestHeadingLevel,
  splitMarkdownInSections,
} from '../../../helpers'
import { useNavState } from '../../../hooks'
import IntersectionObserver from '../../IntersectionObserver.vue'
import { MarkdownRenderer } from '../../MarkdownRenderer'

const props = defineProps<{
  value?: string
}>()

const sections = computedAsync(
  async () => {
    if (!props.value) {
      return []
    }

    const allHeadings = await getHeadingsFromMarkdown(props.value)
    // We only add one level to the sidebar. By default all h1, but if there are no h1, then h2 …
    const lowestHeadingLevel = getLowestHeadingLevel(allHeadings)

    return await Promise.all(
      splitMarkdownInSections(props.value, lowestHeadingLevel).map(
        async (content) => {
          const headings = await getHeadingsFromMarkdown(content)

          return {
            heading: headings[0],
            content,
          }
        },
      ),
    )
  },
  [], // initial state
)

const { getHeadingId, hash, isIntersectionEnabled } = useNavState()

function handleScroll(headingId: string) {
  if (!isIntersectionEnabled.value) return

  // We use replaceState so we don't trigger the url hash watcher and trigger a scroll
  // this is why we set the hash value directly
  window.history.replaceState({}, '', `#${headingId}`)
  hash.value = headingId ?? ''
}
</script>
<template>
  <template v-if="value">
    <div
      v-for="(section, index) in sections"
      :key="index">
      <!-- With a Heading -->
      <template v-if="section.heading">
        <IntersectionObserver
          :id="getHeadingId(section.heading)"
          class="introduction-description-heading"
          @intersecting="() => handleScroll(getHeadingId(section.heading))">
          <MarkdownRenderer
            :value="section.content"
            withImages />
        </IntersectionObserver>
      </template>
      <!-- Without a heading -->
      <template v-else>
        <MarkdownRenderer
          :value="section.content"
          withImages />
      </template>
    </div>
  </template>
</template>

<style scoped>
.introduction-description-heading {
  scroll-margin-top: 64px;
}
</style>
