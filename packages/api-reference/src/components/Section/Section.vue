<script setup lang="ts">
import { navigate, useNavigate } from '../../hooks'
import IntersectionObserver from '../IntersectionObserver.vue'

const props = defineProps<{
  id?: string
  label?: string
}>()

const { canIntersect } = useNavigate()

function handleScroll() {
  if (!props.label || !canIntersect.value) return

  navigate(props, false)
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
.references-narrow .section {
  padding: calc(48px + var(--refs-header-height)) 24px 48px 24px;
}
.section:not(:last-of-type) {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
</style>
