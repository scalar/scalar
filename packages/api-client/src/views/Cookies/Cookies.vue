<script setup lang="ts">
import { Sidebar } from '@/components'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import SubpageHeader from '@/components/SubpageHeader.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { useWorkspace } from '@/store/workspace'
import {
  type Cookie,
  createCookie,
} from '@scalar/oas-utils/entities/workspace/cookie'
import { nanoid } from 'nanoid'
import { useRouter } from 'vue-router'

import CookieForm from './CookieForm.vue'
import CookieRaw from './CookieRaw.vue'

const { cookies, cookieMutators } = useWorkspace()
const router = useRouter()

const addCookieHandler = () => {
  const cookie = createCookie({
    uid: nanoid(),
    name: 'Cookie',
    value: '',
    domain: '',
    path: '/',
    secure: false,
    httpOnly: false,
    sameSite: 'None',
  })

  cookieMutators.add(cookie)
  router.push(cookie.uid)
}

const removeCookie = (uid: string) => {
  cookieMutators.delete(uid)
  const remainingCookies: Cookie[] = Object.values(cookies).filter(
    (cookie) => (cookie as Cookie).uid !== uid,
  ) as Cookie[]
  if (remainingCookies.length > 1) {
    const lastCookie: Cookie = remainingCookies[remainingCookies.length - 1]
    router.push(lastCookie.uid)
  } else if (
    remainingCookies.length === 1 &&
    remainingCookies[0].uid === 'default'
  ) {
    router.push('default')
  }
}
</script>
<template>
  <SubpageHeader>
    <ViewLayout>
      <Sidebar title="Cookies">
        <template #content>
          <div class="flex-1">
            <SidebarList>
              <SidebarListElement
                v-for="cookie in cookies"
                :key="cookie.uid"
                class="text-xs"
                :variable="{ name: cookie.name, uid: cookie.uid }"
                @delete="removeCookie(cookie.uid)" />
            </SidebarList>
          </div>
        </template>
        <template #button>
          <SidebarButton :click="addCookieHandler">
            <template #title>Add Item</template>
          </SidebarButton>
        </template>
      </Sidebar>

      <ViewLayoutContent class="flex-1">
        <CookieForm />
        <CookieRaw />
      </ViewLayoutContent>
    </ViewLayout>
  </SubpageHeader>
</template>
