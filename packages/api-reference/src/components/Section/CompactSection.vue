<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { nextTick, ref, watch } from 'vue'

import { Section } from '.'
import { scrollToId } from '../../helpers'
import { useNavState } from '../../hooks'
import Anchor from '../Anchor/Anchor.vue'

const props = defineProps<{
  id: string
  label?: string
}>()
const { hash } = useNavState()

const open = ref(false)

watch(
  hash,
  async (id) => {
    if (id === props.id && !open.value) {
      open.value = true
      await nextTick()
      scrollToId(props.id)
    }
  },
  { immediate: true },
)
</script>
<template>
  <div
    :aria-expanded="open"
    class="collapsible-section">
    <div
      class="collapsible-section-trigger"
      :class="{ 'collapsible-section-trigger-open': open }"
      @click="open = !open">
      <ScalarIcon
        :icon="open ? 'ChevronDown' : 'ChevronRight'"
        size="sm" />
      <Anchor
        :id="id"
        class="collapsible-section-header">
        <slot name="heading" />
      </Anchor>
    </div>
    <Section
      v-if="open"
      :id="id"
      class="collapsible-section-content"
      :label="label">
      <slot />
    </Section>
  </div>
</template>
<style scoped>
.collapsible-section {
  padding: 0 0 10px;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
  position: relative;
}
.collapsible-section-header {
  color: var(--scalar-color-1);
}
.collapsible-section .collapsible-section-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-top: 10px;
  font-size: var(--scalar-font-size-3);
}
.collapsible-section .collapsible-section-trigger:after {
  content: '';
  height: 10px;
  width: 100%;
  position: absolute;
  bottom: 0;
}
.collapsible-section .collapsible-section-trigger-open {
  margin-bottom: 10px;
}
.collapsible-section-trigger svg {
  color: var(--scalar-color-3);
  position: absolute;
  left: -18px;
  margin-top: 1px;
}
.collapsible-section:hover .collapsible-section-trigger svg {
  color: var(--scalar-color-1);
}
.collapsible-section .collapsible-section-trigger :deep(.anchor-copy) {
  line-height: 18.5px;
}
.collapsible-section-content {
  padding: 0;
  margin: 0;
  scroll-margin-top: 140px;
}
</style>
