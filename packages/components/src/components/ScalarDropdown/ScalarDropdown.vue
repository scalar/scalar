<script setup lang="ts">
import {
  type Placement,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/vue'
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'
import { type Ref, computed, ref, watch } from 'vue'

const props = defineProps<{
  placement?: Placement
  resize?: boolean
}>()

defineOptions({
  inheritAttrs: false,
})

const dropdownRef: Ref<HTMLElement | null> = ref(null)

const buttonWrapper: Ref<HTMLElement | null> = ref(null)

const triggerWidth = ref(0)
const observer = new ResizeObserver(([entry]) => {
  if (!entry) return
  triggerWidth.value = entry.target.clientWidth
})

/** Fallback to div wrapper if a button element is not provided */
const triggerRef = computed(
  () => buttonWrapper.value?.children?.[0] || buttonWrapper.value,
)

// Watch the width of the trigger if fullWidth is enabled
watch(
  () => [props.resize, triggerRef.value],
  ([observe]) => {
    if (!triggerRef.value) return
    if (observe) observer.observe(triggerRef.value)
    else observer.disconnect()
  },
  { immediate: true },
)

const { floatingStyles } = useFloating(triggerRef, dropdownRef, {
  placement: props.placement || 'bottom-start',
  whileElementsMounted: autoUpdate,
  middleware: [offset(5), flip(), shift()],
})
</script>
<template>
  <Menu>
    <div
      ref="buttonWrapper"
      :class="{ contents: !!$slots.default }">
      <MenuButton as="template">
        <slot />
      </MenuButton>
    </div>
    <div
      ref="dropdownRef"
      class="relative z-context"
      :style="floatingStyles">
      <MenuItems
        class="relative flex w-56 flex-col p-0.75"
        :style="{ width: resize ? `${triggerWidth}px` : undefined }"
        v-bind="$attrs">
        <slot name="items" />
        <div
          class="absolute inset-0 -z-1 rounded bg-back-1 shadow-md brightness-lifted" />
      </MenuItems>
    </div>
  </Menu>
</template>
<style scoped>
.floating {
  position: relative;
  z-index: 1000;
}
</style>
