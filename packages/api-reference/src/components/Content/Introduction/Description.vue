<script setup lang="ts">
import {
  type DescriptionSectionSSRKey,
  type SSRState,
  createHash,
  ssrState,
} from '@scalar/oas-utils'
import { computedAsync } from '@vueuse/core'
import { onServerPrefetch, useSSRContext } from 'vue'

import {
  getHeadingsFromMarkdown,
  getLowestHeadingLevel,
  sleep,
  splitMarkdownInSections,
} from '../../../helpers'
import { useNavState } from '../../../hooks'
import IntersectionObserver from '../../IntersectionObserver.vue'
import { MarkdownRenderer } from '../../MarkdownRenderer'

const props = defineProps<{
  value?: string
}>()

const ssrHash = createHash(props.value)
const ssrStateKey: DescriptionSectionSSRKey = `components-Content-Introduction-Description-sections${ssrHash}`

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

const { getHeadingId, hash, isIntersectionEnabled, pathRouting } = useNavState()

function handleScroll(headingId = '') {
  if (!isIntersectionEnabled.value) return

  const newUrl = new URL(window.location.href)

  // If we are pathrouting, set path instead of hash
  if (pathRouting.value) {
    newUrl.pathname = pathRouting.value.basePath + '/' + headingId
  } else {
    newUrl.hash = headingId
  }
  hash.value = headingId

  // We use replaceState so we don't trigger the url hash watcher and trigger a scroll
  // this is why we set the hash value directly
  window.history.replaceState({}, '', newUrl)
}

// SSR hack - waits for the computedAsync to complete then we save the state
onServerPrefetch(async () => {
  const ctx = useSSRContext<SSRState>()
  await sleep(1)
  ctx!.payload.data[ssrStateKey] = sections.value
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
