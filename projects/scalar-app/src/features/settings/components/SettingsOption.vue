<script lang="ts">
/**
 * A selectable option row for the workspace settings sections.
 *
 * Renders a radio in front of the label and an optional trailing slot for
 * things like theme swatches or framework logos.
 *
 * @example
 * <SettingsOption
 *   :selected="isSelected"
 *   @click="select()">
 *   Use proxy.scalar.com (default)
 * </SettingsOption>
 */
export default {}
</script>
<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarCheckbox } from '@scalar/components/checkbox-input'
import { cva } from '@scalar/use-hooks/useBindCx'

const { selected = false } = defineProps<{
  /** Whether this option is the currently selected one */
  selected?: boolean
}>()

defineSlots<{
  /** The label of the option */
  default: () => unknown
  /** Rendered at the end of the row, for example theme swatches or a logo */
  trailing?: () => unknown
}>()

/**
 * The ghost variant is used as the base because the solid variant paints a
 * dark button background on hover and while the option is pressed, which
 * clashes with the light background and text colors we set here.
 */
const optionStyles = cva({
  base: 'border-border w-full justify-between gap-2 border pl-2 text-left shadow-none transition-colors',
  variants: {
    selected: {
      true: 'bg-b-2 text-c-1 hover:bg-b-2 active:bg-b-2',
      false: 'bg-b-1 text-c-1 hover:bg-b-2 active:bg-b-2',
    },
  },
})
</script>
<template>
  <ScalarButton
    :aria-pressed="selected"
    :class="optionStyles({ selected })"
    variant="ghost">
    <span class="flex min-w-0 items-center gap-2">
      <ScalarCheckbox
        class="shrink-0"
        :selected
        type="radio" />
      <slot />
    </span>

    <slot name="trailing" />
  </ScalarButton>
</template>
