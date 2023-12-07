<script setup lang="ts">
import { computedAsync } from '@vueuse/core'

import {
  getHeadingsFromMarkdown,
  getLowestHeadingLevel,
  splitMarkdownInSections,
} from '../../../helpers'
import { getHeadingHash } from '../../../hooks'
import IntersectionObserver from '../../IntersectionObserver.vue'
import MarkdownRenderer from '../MarkdownRenderer.vue'

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
</script>
<template>
  <template v-if="value">
    <div
      v-for="(section, index) in sections"
      :key="index">
      <!-- With a Heading -->
      <template v-if="section.heading">
        <IntersectionObserver :id="getHeadingHash(section.heading)">
          <MarkdownRenderer :value="section.content" />
        </IntersectionObserver>
      </template>
      <!-- Without a heading -->
      <template v-else>
        <MarkdownRenderer :value="section.content" />
      </template>
    </div>
  </template>
</template>
