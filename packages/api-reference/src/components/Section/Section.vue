<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'

import IntersectionObserver from '../IntersectionObserver.vue'

const props = defineProps<{
  id?: string
  label?: string
}>()

const { setBreadcrumb } = useApiClientStore()

function handleScroll() {
  if (!props.label) return
  setBreadcrumb(props.label)
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

  max-width: 1120px;
  margin: auto;

  /* Extend by header height to line up scroll position */
  padding: calc(90px + var(--refs-header-height)) 0 90px 0;
  margin-top: calc(-1 * var(--refs-header-height));
}
.references-narrow .section {
  padding: calc(48px + var(--refs-header-height)) 24px 48px 24px;
}
.section:not(:last-of-type) {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
</style>
