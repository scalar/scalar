<script setup lang="ts">
import { computedAsync } from '@vueuse/core'
import { onServerPrefetch, useSSRContext } from 'vue'

import {
  createHash,
  getHeadingsFromMarkdown,
  getLowestHeadingLevel,
  sleep,
  splitMarkdownInSections,
} from '../../../helpers'
import { useNavState } from '../../../hooks'
import { ssrState } from '../../../stores'
import { type SSRState } from '../../../types'
import IntersectionObserver from '../../IntersectionObserver.vue'
import { MarkdownRenderer } from '../../MarkdownRenderer'

const props = defineProps<{
  value?: string
}>()

const ssrHash = createHash(props.value)
const ssrStateKey = `components-Content-Introduction-Description-sections${ssrHash}`

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
  ssrState[ssrStateKey] ?? [], // initial state
)

const { getHeadingId, hash, isIntersectionEnabled } = useNavState()

function handleScroll(headingId: string) {
  if (!isIntersectionEnabled.value) return

  // We use replaceState so we don't trigger the url hash watcher and trigger a scroll
  // this is why we set the hash value directly
  window.history.replaceState({}, '', `#${headingId}`)
  hash.value = headingId ?? ''
}

// SSR hack - waits for the computedAsync to complete then we save the state
onServerPrefetch(async () => {
  const ctx = useSSRContext<SSRState>()
  await sleep(1)
  ctx!.scalarState[ssrStateKey] = sections.value
})
</script>
<template>
  <div
    v-if="value"
    class="introduction-description">
    <template
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
</style>
