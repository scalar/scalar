<script setup lang="ts">
import { cva, cx, ScalarButton, ScalarIcon } from '@scalar/components'
import { useColorMode } from '@scalar/use-hooks/useColorMode'

const { colorMode, setColorMode } = useColorMode()

const buttonStyles = cva({
  base: 'w-full shadow-none text-c-1 justify-start pl-2 gap-2 border',
  variants: {
    active: {
      true: 'bg-primary text-c-1 hover:bg-inherit',
      false: 'bg-b-1 hover:bg-b-2',
    },
  },
})
</script>
<template>
  <div class="flex flex-col gap-2">
    <ScalarButton
      :class="cx(buttonStyles({ active: colorMode === 'system' }))"
      @click="setColorMode('system')">
      <div
        class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
        :class="{
          'bg-c-accent text-b-1 border-transparent': colorMode === 'system',
        }">
        <ScalarIcon
          v-if="colorMode === 'system'"
          icon="Checkmark"
          size="xs"
          thickness="3.5" />
      </div>
      System Preference (default)
    </ScalarButton>
    <ScalarButton
      :class="cx(buttonStyles({ active: colorMode === 'light' }))"
      @click="setColorMode('light')">
      <div
        class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
        :class="{
          'bg-c-accent text-b-1 border-transparent': colorMode === 'light',
        }">
        <ScalarIcon
          v-if="colorMode === 'light'"
          icon="Checkmark"
          size="xs"
          thickness="3.5" />
      </div>
      Light Mode Always
    </ScalarButton>
    <ScalarButton
      :class="cx(buttonStyles({ active: colorMode === 'dark' }))"
      @click="setColorMode('dark')">
      <div
        class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
        :class="{
          'bg-c-accent text-b-1 border-transparent': colorMode === 'dark',
        }">
        <ScalarIcon
          v-if="colorMode === 'dark'"
          icon="Checkmark"
          size="xs"
          thickness="3.5" />
      </div>
      Dark Mode Always
    </ScalarButton>
  </div>
</template>
