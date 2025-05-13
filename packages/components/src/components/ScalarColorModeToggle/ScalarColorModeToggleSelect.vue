<script lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { useColorMode } from '@scalar/use-hooks/useColorMode'

import ScalarColorModeToggleIcon from './ScalarColorModeToggleIcon.vue'

/**
 * Scalar Color Mode Toggle component
 *
 * A row of buttons that allow selecting of light, system, and dark mode
 * using the {@link useColorMode} hook.
 *
 * @example
 *   <ScalarColorModeToggle />
 */
export default {}
</script>
<script lang="ts" setup>
type LightSystemDarkOption = 'light' | 'system' | 'dark'

const { cx } = useBindCx()

const { setColorMode, colorMode } = useColorMode()

const model = defineModel<LightSystemDarkOption>()
const offsetModel = defineModel<Number>('offset', { default: 0 })

const options: LightSystemDarkOption[] = ['light', 'system', 'dark']

const getOffsetValue = (mode: LightSystemDarkOption): number => {
  return Math.max(options.indexOf(mode), 0)
}

const ariaLabelFor = (mode: LightSystemDarkOption): string => {
  switch (mode) {
    case 'dark':
      return 'Set dark mode'
    case 'light':
      return 'Set light mode'
  }

  return 'Use system / device setting'
}

function update(mode: LightSystemDarkOption) {
  model.value = mode
  setColorMode(mode)

  offsetModel.value = getOffsetValue(mode) * 33.33
}

// Set the default, so the offset's correct initially
update(colorMode.value)
</script>
<template>
  <div
    class="btn-group flex flex-row button-group-container w-[72px] rounded-lg"
    :style="{ '--bg-offset': `${offsetModel}%` }">
    <button
      type="button"
      v-for="(option, index) in options"
      v-bind="
        cx(
          'group/select flex h-6 w-6 mx-system brightness-lifted items-center py-1.5 relative outline-none border-2 ' +
            (index === 0
              ? 'rounded-l-lg'
              : index === options.length - 1
                ? 'rounded-r-lg'
                : ''),
        )
      "
      :aria-label="ariaLabelFor(option)"
      :aria-pressed="option === model"
      @click="update(option)">
      <!-- Icon -->
      <ScalarColorModeToggleIcon
        is="div"
        class="mx-auto"
        v-if="option !== 'system'"
        :mode="option" />

      <template v-else>
        <span
          class="bg-b-3 font-bold rounded-full toggle-icon-dark size-4 flex items-center justify-center text-c-1 mx-auto text-[13px]">
          <span class="-mt-px">A</span>
        </span>
      </template>
    </button>
  </div>
</template>
<style scoped>
.button-group-container {
  --bg-offset: 0%;

  position: relative;
  overflow: hidden;
}

.button-group-container button {
  background: transparent;
  z-index: 1;
}

.button-group-container:after {
  content: '';
  width: 33.33%;
  height: 100%;
  position: absolute;
  top: 0;
  left: var(--bg-offset);
  background: var(--scalar-border-color);
  transition: left 0.3s;
  z-index: 0;
}
</style>
