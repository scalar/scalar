<script setup lang="ts">
import { ref, type DefineComponent } from 'vue'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'

import SettingsGeneral from './SettingsGeneral.vue'

type SettingsGroup = {
  component: DefineComponent<any, any, any>
  title: string
}

const settings: Record<string, SettingsGroup> = {
  general: {
    component: SettingsGeneral,
    title: 'General',
  },
}

const activeSetting = ref('general')
</script>
<template>
  <ViewLayout>
    <ViewLayoutContent class="flex-1">
      <!-- Settings Navigation -->
      <div class="border-c-6 mb-6 flex border-b">
        <button
          v-for="(setting, key) in settings"
          :key="key"
          :class="[
            'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
            activeSetting === key
              ? 'border-c-accent text-c-accent'
              : 'text-c-2 hover:text-c-1 border-transparent',
          ]"
          @click="activeSetting = key">
          {{ setting.title }}
        </button>
      </div>

      <!-- Settings Content -->
      <component
        :is="settings[activeSetting]!.component"
        v-if="settings[activeSetting]" />
    </ViewLayoutContent>
  </ViewLayout>
</template>
