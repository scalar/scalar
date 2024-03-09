<script setup lang="ts">
import { useNavState, useSidebar } from '../../hooks'
import IntersectionObserver from '../IntersectionObserver.vue'

const props = defineProps<{
  id?: string
  label?: string
}>()

const { getSectionId, hash, isIntersectionEnabled } = useNavState()
const { setCollapsedSidebarItem } = useSidebar()

function handleScroll() {
  if (!props.label || !isIntersectionEnabled.value) return

  // We use replaceState so we don't trigger the url hash watcher and trigger a scroll
  // this is why we set the hash value directly
  window.history.replaceState({}, '', `#${props.id}`)
  hash.value = props.id ?? ''

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

  /* Extend by header height to line up scroll position */
  padding: calc(90px + var(--refs-header-height)) 0 90px 0;
  margin-top: calc(-1 * var(--refs-header-height));
}
.references-classic .section {
  padding: 48px 0;
  gap: 24px;
}
@container narrow-references-container (max-width: 900px) {
  .references-classic .section,
  .section {
    padding: calc(48px + var(--refs-header-height)) 24px 48px 24px;
  }
}
.section:not(:last-of-type) {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
</style>
