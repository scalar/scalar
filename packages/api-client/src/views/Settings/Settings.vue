<script setup lang="ts">
import {
  ScalarViewLayout,
  ScalarViewLayoutContent,
} from '@scalar/components/components/ScalarViewLayout'
import { ref, type DefineComponent } from 'vue'

import SettingsGeneral from './SettingsGeneral.vue'

type SettingsGroup = {
  component: DefineComponent<any, any, any>
  title: string
}

const settings: Record<string, SettingsGroup> = {
  general: {
    component: SettingsGeneral,
    title: 'general',
  },
}

const activeSetting = ref('general')
</script>
<template>
  <ScalarViewLayout>
    <ScalarViewLayoutContent class="flex-1">
      <component
        :is="settings[activeSetting]!.component"
        v-if="settings[activeSetting]" />
    </ScalarViewLayoutContent>
  </ScalarViewLayout>
</template>
