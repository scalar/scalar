<script setup lang="ts">
import { type ReferenceProps } from 'src/types'

import { useDarkModeState } from '../hooks/useDarkModeState'
import ApiReferenceBase from './ApiReferenceBase.vue'
import DarkModeToggle from './DarkModeToggle.vue'
import SearchButton from './SearchButton.vue'

const props = defineProps<ReferenceProps>()

const { toggleDarkMode, isDark } = useDarkModeState()
</script>
<template>
  <ApiReferenceBase v-bind="props">
    <template #sidebar-start>
      <SearchButton :searchHotKey="props.configuration?.searchHotKey" />
    </template>
    <template #sidebar-end>
      <DarkModeToggle
        :isDarkMode="isDark"
        @toggleDarkMode="toggleDarkMode" />
    </template>
    <template #header><slot name="header" /></template>
    <template #footer><slot name="footer" /></template>
  </ApiReferenceBase>
</template>
