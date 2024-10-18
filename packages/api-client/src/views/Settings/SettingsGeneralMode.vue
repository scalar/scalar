<script setup lang="ts">
import { useDarkModeState } from '@/hooks'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { ref } from 'vue'

const { colorMode, setDarkMode } = useDarkModeState()
const currentMode = ref<string>('System Preference')

// Initialize currentMode based on colorMode value
if (colorMode.value === 'system') {
  currentMode.value = 'System Preference'
} else if (colorMode.value === 'dark') {
  currentMode.value = 'Dark'
} else {
  currentMode.value = 'Light'
}

const setSystemDarkMode = () => {
  setDarkMode(null)
  currentMode.value = 'System Preference'
}

const setLightMode = () => {
  setDarkMode(false)
  currentMode.value = 'Light'
}

const setDarkModePreference = () => {
  setDarkMode(true)
  currentMode.value = 'Dark'
}
</script>

<template>
  <h3 class="font-bold mb-1 mt-8">Appearance</h3>
  <p class="text-c-2 mb-4">Set light or dark mode for your workspace.</p>
  <div class="flex flex-col gap-2">
    <ScalarButton
      :class="[
        'w-full shadow-none text-c-1 justify-start pl-2 gap-2',
        currentMode === 'System Preference'
          ? 'bg-b-1 shadow-border-1/2 text-c-1'
          : 'bg-b-2',
      ]"
      @click="setSystemDarkMode">
      <div
        class="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] p-1">
        <ScalarIcon
          v-if="currentMode === 'System Preference'"
          icon="Checkmark"
          size="xs"
          thickness="3.5" />
      </div>
      System Preference
    </ScalarButton>
    <ScalarButton
      :class="[
        'w-full shadow-none text-c-1 justify-start pl-2 gap-2',
        currentMode === 'Light'
          ? 'bg-b-1 shadow-border-1/2 text-c-1'
          : 'bg-b-2',
      ]"
      @click="setLightMode">
      <div
        class="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] p-1">
        <ScalarIcon
          v-if="currentMode === 'Light'"
          icon="Checkmark"
          size="xs"
          thickness="3.5" />
      </div>
      Light Mode
    </ScalarButton>
    <ScalarButton
      :class="[
        'w-full shadow-none text-c-1 justify-start pl-2 gap-2 mb-8',
        currentMode === 'Dark' ? 'bg-b-1 shadow-border-1/2 text-c-1' : 'bg-b-2',
      ]"
      @click="setDarkModePreference">
      <div
        class="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] p-1">
        <ScalarIcon
          v-if="currentMode === 'Dark'"
          icon="Checkmark"
          size="xs"
          thickness="3.5" />
      </div>
      Dark Mode
    </ScalarButton>
  </div>
</template>
