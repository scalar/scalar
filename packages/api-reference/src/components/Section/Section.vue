<script setup lang="ts">
import { useNavState, useSidebar } from '../../hooks'
import IntersectionObserver from '../IntersectionObserver.vue'

const props = defineProps<{
  id?: string
  label?: string
}>()

const { getSectionId, hash, isIntersectionEnabled, pathRouting } = useNavState()
const { setCollapsedSidebarItem } = useSidebar()

function handleScroll() {
  if (!props.label || !isIntersectionEnabled.value) return

  // We use replaceState so we don't trigger the url hash watcher and trigger a scroll
  // this is why we set the hash value directly
  const newUrl = new URL(window.location.href)
  const id = props.id ?? ''

  // If we are pathrouting, set path instead of hash
  if (pathRouting.value) {
    newUrl.pathname = pathRouting.value.basePath + '/' + id
  } else {
    newUrl.hash = id
  }
  hash.value = id

  window.history.replaceState({}, '', newUrl)

  // Open models on scroll
  if (props.id?.startsWith('model'))
    setCollapsedSidebarItem(getSectionId(props.id), true)
}
</script>
<template>
  <IntersectionObserver
    is="section"
    :id="id"
    class="section"
    @intersecting="handleScroll">
    <slot />
  </IntersectionObserver>
</template>

<style scoped>
.section {
  position: relative;
  display: flex;
  flex-direction: column;

  max-width: var(--refs-content-max-width);
  margin: auto;

  padding: 90px 0;

  /* Offset by header height to line up scroll position */
  scroll-margin-top: var(--refs-header-height);
}
.references-classic .section {
  padding: 48px 0;
  gap: 24px;
}
@container narrow-references-container (max-width: 900px) {
  .references-classic .section,
  .section {
    padding: 48px 24px;
  }
}
.section:not(:last-of-type) {
  border-bottom: 1px solid var(--scalar-border-color);
}
</style>
