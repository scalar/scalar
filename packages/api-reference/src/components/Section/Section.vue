<script setup lang="ts">
import IntersectionObserver from '@/components/IntersectionObserver.vue'
import { useSidebar } from '@/features/sidebar'
import { useNavState } from '@/hooks/useNavState'

const { id, label } = defineProps<{
  id?: string
  label?: string
}>()

const { getSectionId, isIntersectionEnabled, replaceHistoryStateWithHash } =
  useNavState()
const { setCollapsedSidebarItem } = useSidebar()

function handleScroll() {
  if (!label || !isIntersectionEnabled.value) {
    return
  }

  if (id) {
    // Open parent section
    setCollapsedSidebarItem(getSectionId(id), true)

    // Update the hash in the URL
    replaceHistoryStateWithHash(id)

    // TODO: Does this open webhooks and models?
  }
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
.section:has(~ div.contents) {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
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
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
</style>
