<script setup lang="ts">
import DataTableCell from '@/components/DataTable/DataTableCell.vue'
import DataTableText from '@/components/DataTable/DataTableText.vue'
import { useDarkModeState } from '@/hooks'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import { ref, watch } from 'vue'

const { isDark, setDarkMode } = useDarkModeState()
const currentMode = ref<string>('System Preference')

// Initialize currentMode based on isDark value
if (isDark.value === null) {
  currentMode.value = 'System Preference'
} else if (isDark.value) {
  currentMode.value = 'Dark'
} else {
  currentMode.value = 'Light'
}

// Watch for changes in isDark to update currentMode
watch(isDark, (newVal) => {
  if (newVal === null) {
    currentMode.value = 'System Preference'
  } else if (newVal) {
    currentMode.value = 'Dark'
  } else {
    currentMode.value = 'Light'
  }
})

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
  <DataTableText text="Mode" />
  <DataTableCell>
    <ScalarDropdown>
      <ScalarButton
        class="font-normal h-full justify-start py-1.5 px-1.5 text-c-1 hover:bg-b-2 w-fit"
        fullWidth
        variant="ghost">
        <h2 class="font-medium m-0 text-sm flex gap-1.5 items-center">
          {{ currentMode }}
          <ScalarIcon
            class="size-2.5"
            icon="ChevronDown"
            thickness="3.5" />
        </h2>
      </ScalarButton>
      <template #items>
        <ScalarDropdownItem @click.stop="setSystemDarkMode">
          System Preference
        </ScalarDropdownItem>
        <ScalarDropdownItem @click.stop="setLightMode">
          Light Mode
        </ScalarDropdownItem>
        <ScalarDropdownItem @click.stop="setDarkModePreference">
          Dark Mode
        </ScalarDropdownItem>
      </template>
    </ScalarDropdown>
  </DataTableCell>
</template>
