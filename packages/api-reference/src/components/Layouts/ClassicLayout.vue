<script setup lang="ts">
import { computed } from 'vue'

import type { ReferenceLayoutProps, ReferenceSlots } from '../../types'
import ApiReferenceLayout from '../ApiReferenceLayout.vue'
import ClassicHeader from '../ClassicHeader.vue'
import { DarkModeIconToggle } from '../DarkModeToggle'
import SearchButton from '../SearchButton.vue'

const props = defineProps<ReferenceLayoutProps>()

defineEmits<{
  (e: 'toggleDarkMode'): void
}>()

defineSlots<ReferenceSlots>()
// Override the sidebar value and hide it
const config = computed(() => ({ ...props.configuration, showSidebar: false }))
</script>
<template>
  <ApiReferenceLayout
    :configuration="config"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec">
    <template #content-start="{ spec }">
      <ClassicHeader>
        <SearchButton
          class="t-doc__sidebar"
          :searchHotKey="config.searchHotKey"
          :spec="spec" />
        <template #dark-mode-toggle>
          <DarkModeIconToggle
            :isDarkMode="isDark"
            @toggleDarkMode="$emit('toggleDarkMode')" />
        </template>
      </ClassicHeader>
    </template>
    <!-- Expose the content end slot as a slot for the footer -->
    <template #content-end>
      <slot name="footer" />
    </template>
  </ApiReferenceLayout>
</template>
