<script setup lang="ts">
import { Sidebar } from '@/components'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { useSidebar } from '@/hooks'
import type { HotKeyEvent } from '@/libs'
import { useWorkspace } from '@/store'
import { ScalarIcon } from '@scalar/components'
import { type Cookie, cookieSchema } from '@scalar/oas-utils/entities/cookie'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import CookieForm from './CookieForm.vue'
import CookieRaw from './CookieRaw.vue'

const { cookies, cookieMutators, events } = useWorkspace()
const { collapsedSidebarFolders, toggleSidebarFolder } = useSidebar()
const router = useRouter()
const route = useRoute()

const addCookieHandler = () => {
  const cookieIndex = Object.keys(cookies).length

  const cookie = cookieSchema.parse({
    name: `Cookie ${cookieIndex}`,
    value: '',
    domain: 'example.com',
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
    const lastCookie = remainingCookies[remainingCookies.length - 1]
    if (lastCookie) {
      router.push(lastCookie.uid)
    }
  } else if (
    remainingCookies.length === 1 &&
    remainingCookies[0]?.uid === 'default'
  ) {
    router.push('default')
  }
}

const groupedCookies = computed(() => {
  const groups: Record<string, Record<string, Cookie[]>> = {}
  Object.values(cookies).forEach((cookie) => {
    const domain = cookie.domain ?? ''
    const path = cookie.path ?? ''
    if (!groups[domain]) {
      groups[domain] = {}
    }
    if (!groups[domain][path]) {
      groups[domain][path] = []
    }
    groups[domain][path].push(cookie)
  })
  return groups
})

const showChildren = (key: string) => {
  return collapsedSidebarFolders[key]
}

const handleHotKey = (event?: HotKeyEvent) => {
  if (event?.createNew && route.name === 'cookies') {
    addCookieHandler()
  }
}

const handleNavigation = (event: MouseEvent, uid: string) => {
  const path = `/workspace/default/cookies/${uid}`
  if (event.metaKey) {
    window.open(path, '_blank')
  } else {
    router.push({ path })
  }
}

/** Initialize collapsedSidebarFolders to be open by default */
onMounted(() => {
  const domains = Object.keys(groupedCookies.value)
  const allPaths = Object.entries(groupedCookies.value).flatMap(
    ([domain, paths]) => Object.keys(paths).map((path) => domain + path),
  )
  domains.forEach((domain) => {
    collapsedSidebarFolders[domain] = true
  })
  allPaths.forEach((path) => {
    collapsedSidebarFolders[path] = true
  })
  events.hotKeys.on(handleHotKey)
})

onBeforeUnmount(() => events.hotKeys.off(handleHotKey))
</script>
<template>
  <ViewLayout>
    <Sidebar title="Cookies">
      <template #content>
        <div class="flex-1">
          <SidebarList>
            <div
              v-for="(paths, domain) in groupedCookies"
              :key="domain">
              <button
                class="flex font-medium gap-1.5 items-center px-2 py-1.5 text-left text-sm w-full break-words rounded hover:bg-b-2"
                type="button"
                @click="toggleSidebarFolder(domain)">
                <ScalarIcon
                  class="text-c-3"
                  :class="{
                    'rotate-90': collapsedSidebarFolders[domain],
                  }"
                  icon="ChevronRight"
                  size="md" />
                {{ domain }}
              </button>
              <div
                v-show="showChildren(domain)"
                class="before:bg-border before:pointer-events-none before:z-1 before:absolute before:left-[calc(1rem_-_.5px)] before:top-0 before:h-[calc(100%_+_.5px)] last:before:h-full before:w-[.5px] mb-[.5px] last:mb-0 relative">
                <div
                  v-for="(cookieList, path) in paths"
                  :key="path">
                  <button
                    class="flex font-medium gap-1.5 items-center pl-5 pr-2 py-1.5 text-left text-sm w-full break-words rounded hover:bg-b-2"
                    type="button"
                    @click="toggleSidebarFolder(domain + path)">
                    <ScalarIcon
                      class="text-c-3"
                      :class="{
                        'rotate-90': collapsedSidebarFolders[domain + path],
                      }"
                      icon="ChevronRight"
                      size="md" />
                    {{ path }}
                  </button>
                  <div
                    v-show="showChildren(domain + path)"
                    class="before:bg-border before:pointer-events-none before:z-1 before:absolute before:left-[calc(1.75rem_-_.5px)] before:top-0 before:h-[calc(100%_+_.5px)] last:before:h-full before:w-[.5px] mb-[.5px] last:mb-0 relative">
                    <SidebarListElement
                      v-for="cookie in cookieList"
                      :key="cookie.uid"
                      class="cookie text-xs"
                      type="cookies"
                      :variable="{ name: cookie.name, uid: cookie.uid }"
                      :warningMessage="`Are you sure you want to delete this cookie?`"
                      @click.prevent="handleNavigation($event, cookie.uid)"
                      @delete="removeCookie(cookie.uid)" />
                  </div>
                </div>
              </div>
            </div>
          </SidebarList>
        </div>
      </template>
      <template #button>
        <SidebarButton
          :click="addCookieHandler"
          hotkey="N">
          <template #title>Add Cookie</template>
        </SidebarButton>
      </template>
    </Sidebar>

    <ViewLayoutContent class="flex-1">
      <CookieForm />
      <CookieRaw />
    </ViewLayoutContent>
  </ViewLayout>
</template>
