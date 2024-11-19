<script setup lang="ts">
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { useColorMode } from '@scalar/use-hooks/useColorMode'

const { colorMode, setColorMode } = useColorMode()
</script>
<template>
  <div class="flex flex-col gap-2">
    <ScalarButton
      :class="[
        'w-full shadow-none text-c-1 justify-start pl-2 gap-2 border-1/2',
        colorMode === 'system' ? 'bg-b-2 text-c-1' : 'bg-b-1',
      ]"
      @click="setColorMode('system')">
      <div
        class="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] p-1">
        <ScalarIcon
          v-if="colorMode === 'system'"
          icon="Checkmark"
          size="xs"
          thickness="3.5" />
      </div>
      System Preference (default)
    </ScalarButton>
    <ScalarButton
      :class="[
        'w-full shadow-none text-c-1 justify-start pl-2 gap-2 border-1/2',
        colorMode === 'light' ? 'bg-b-2 text-c-1' : 'bg-b-1',
      ]"
      @click="setColorMode('light')">
      <div
        class="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] p-1">
        <ScalarIcon
          v-if="colorMode === 'light'"
          icon="Checkmark"
          size="xs"
          thickness="3.5" />
      </div>
      Light Mode Always
    </ScalarButton>
    <ScalarButton
      :class="[
        'w-full shadow-none text-c-1 justify-start pl-2 gap-2 mb-8 border-1/2',
        colorMode === 'dark' ? 'bg-b-2 text-c-1' : 'bg-b-1',
      ]"
      @click="setColorMode('dark')">
      <div
        class="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] p-1">
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
