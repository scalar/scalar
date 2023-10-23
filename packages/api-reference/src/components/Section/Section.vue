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
  padding: 90px 0;
}
.references-narrow .section {
  padding: 48px 24px;
}
.section:not(:last-of-type) {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
</style>
