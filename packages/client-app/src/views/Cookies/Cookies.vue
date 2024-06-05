<script setup lang="ts">
import { Sidebar } from '@/components'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { themeClasses } from '@/constants'
import { useWorkspace } from '@/store/workspace'
import { nanoid } from 'nanoid'

import CookieForm from './CookieForm.vue'
import CookieRaw from './CookieRaw.vue'

const { cookies, cookieMutators } = useWorkspace()

function addCookieHandler() {
  const cookie = {
    uid: nanoid(),
    name: 'new cookie',
    value: 'new value',
    domain: 'localhost',
    path: '/',
    secure: false,
    httpOnly: false,
    sameSite: 'None',
    expires: null,
  }

  cookieMutators.add(cookie)
}
</script>
<template>
  <Sidebar>
    <template #title>Domain</template>
    <template #content>
      <div class="flex-1">
        <SidebarList>
          <SidebarListElement
            v-for="cookie in cookies"
            :key="cookie.uid"
            class="text-xs"
            :variable="{ name: cookie.name, uid: cookie.uid }" />
        </SidebarList>
      </div>
    </template>
    <template #button>
      <SidebarButton :click="addCookieHandler">
        <template #title>Add Item</template>
      </SidebarButton>
    </template>
  </Sidebar>

  <!-- TODO possible loading state -->
  <ViewLayout :class="[themeClasses.view]">
    <CookieForm />
    <CookieRaw />
  </ViewLayout>
</template>
