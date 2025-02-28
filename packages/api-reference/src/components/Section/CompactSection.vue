<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { nextTick, ref, useId, watch } from 'vue'

import { scrollToId } from '../../helpers'
import { useNavState } from '../../hooks'
import Anchor from '../Anchor/Anchor.vue'
import Section from './Section.vue'

const props = defineProps<{
  id: string
  label?: string
}>()
const { hash } = useNavState()

const open = ref(false)

const panel = useId()

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
  <div class="collapsible-section">
    <button
      :id="id"
      :aria-controls="panel"
      :aria-expanded="open"
      class="collapsible-section-trigger"
      :class="{ 'collapsible-section-trigger-open': open }"
      type="button"
      @click="open = !open">
      <ScalarIcon
        :icon="open ? 'ChevronDown' : 'ChevronRight'"
        size="md"
        thickness="1.5" />
      <Anchor
        :id="id"
        class="collapsible-section-header">
        <slot name="heading" />
      </Anchor>
    </button>
    <Section
      v-if="open"
      :id="panel"
      class="collapsible-section-content"
      :label="label">
      <slot />
    </Section>
  </div>
</template>
<style scoped>
.collapsible-section {
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
  padding: 10px;
  margin-left: -10px;
  margin-right: -10px;
  font-size: var(--scalar-font-size-3);
  z-index: 1;
  position: relative;
}
.collapsible-section .collapsible-section-trigger:after {
  content: '';
  height: 10px;
  width: 100%;
  position: absolute;
  bottom: 0;
}
.collapsible-section-trigger svg {
  color: var(--scalar-color-3);
  position: absolute;
  left: -19px;
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
