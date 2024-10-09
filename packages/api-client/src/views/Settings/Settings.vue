<script setup lang="ts">
import { Sidebar } from '@/components'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { type DefineComponent, ref } from 'vue'

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
  <ViewLayout>
    <Sidebar title="Settings">
      <template #content>
        <div class="flex-1">
          <SidebarList>
            <SidebarListElement
              v-for="setting in settings"
              :key="setting.title"
              class="text-xs capitalize"
              :isCopyable="false"
              :isDeletable="false"
              :variable="{
                uid: setting.title,
                name: setting.title,
              }">
              {{ setting.title }}
            </SidebarListElement>
          </SidebarList>
        </div>
      </template>
    </Sidebar>
    <ViewLayoutContent class="flex-1">
      <component :is="settings[activeSetting].component" />
    </ViewLayoutContent>
  </ViewLayout>
</template>
