<script setup lang="ts">
import { Sidebar } from '@/components'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import SubpageHeader from '@/components/SubpageHeader.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { ref } from 'vue'

import SettingsGeneral from './SettingsGeneral.vue'

const settings = {
  general: {
    component: SettingsGeneral,
    title: 'General',
  },
}

const activeSetting = ref('general')
</script>
<template>
  <SubpageHeader>
    <ViewLayout>
      <Sidebar title="Settings">
        <template #content>
          <div class="flex-1">
            <SidebarList>
              <SidebarListElement
                v-for="setting in settings"
                :key="setting.title"
                class="text-xs"
                :variable="{
                  uid: setting.title,
                  name: setting.title,
                  isDefault: setting.title === 'General',
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
  </SubpageHeader>
</template>
