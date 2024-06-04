<script setup lang="ts">
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import type { Route } from '@/constants'
import { ScalarIcon } from '@scalar/components'
import { useTooltip } from '@scalar/use-tooltip'
import { type Ref, ref } from 'vue'

defineProps<
  Route & {
    hotkey?: string
    active: boolean
  }
>()

defineEmits<{
  (e: 'close'): void
}>()

const focused = ref(false)
const labelRef: Ref<HTMLDivElement | null> = ref(null)

const tooltipRef = useTooltip({
  content: () => labelRef.value || '',
  offset: [0, 5],
  delay: 500,
})
</script>
<template>
  <div
    ref="tooltipRef"
    class="nav-item"
    :class="{ 'nav-item__active': active }"
    @mouseenter="focused = true"
    @mouseleave="focused = false">
    <div
      class="nav-item-icon-copy flex flex-1 items-center justify-center gap-1.5">
      <ScalarIcon
        class="p-[0.5px]"
        :icon="icon"
        size="xs" />
      <span class="nav-item-copy text-xs">{{ label }}</span>
    </div>
    <div
      v-if="hotkey"
      ref="labelRef">
      <ScalarHotkey :hotkey="hotkey" />
    </div>
    <button
      class="nav-item-close"
      type="button"
      @click="$emit('close')">
      <ScalarIcon icon="Close" />
    </button>
  </div>
</template>
<style scoped>
.nav-item {
  padding: 0 1rem;
  cursor: pointer;
  flex: 1;
  justify-content: center;
  align-items: center;
  display: flex;
  border-radius: var(--scalar-radius);
  background: var(--scalar-background-2);
  border: 1px solid var(--scalar-background-2);
  color: var(--scalar-color-3);
  padding: 4.5px;
  min-width: 0;
  overflow: hidden;
  position: relative;
}
.nav-item-icon-copy {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  mask-image: linear-gradient(
    to left,
    transparent 0,
    var(--scalar-background-2) 20px
  );
}
.nav-item:hover .nav-item-icon-copy {
  mask-image: linear-gradient(
    to left,
    transparent 20px,
    var(--scalar-background-2) 40px
  );
}
.nav-item-copy {
  max-width: calc(100% - 20px);
}
.nav-item:hover {
  color: var(--scalar-color-1);
}
.nav-item__active {
  background-color: var(--scalar-background-1);
  color: var(--scalar-color-1);
  border-color: var(--scalar-border-color);
}
.nav-item-close {
  position: absolute;
  right: 3px;
  padding: 5px;
  border-radius: var(--scalar-radius);
  background: transparent;
  max-width: 20px;
  stroke-width: 1.5px;
  color: var(--scalar-color-3);
  margin-left: -20px;
  opacity: 0;
}
.nav-item:hover .nav-item-close {
  opacity: 1;
}
.nav-item-close:hover {
  background-color: var(--scalar-background-4);
}
.nav-item__active .nav-item-close:hover {
  background-color: var(--scalar-background-2);
}
</style>
