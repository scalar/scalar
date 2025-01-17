<script setup lang="ts">
import { Sidebar } from '@/components'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import type { HotKeyEvent } from '@/libs'
import { useActiveEntities, useWorkspace } from '@/store'
import { type Cookie, cookieSchema } from '@scalar/oas-utils/entities/cookie'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import CookieForm from './CookieForm.vue'

// import CookieRaw from './CookieRaw.vue'

const { cookies, cookieMutators, events, workspaceMutators } = useWorkspace()
const { activeWorkspace, activeCookieId } = useActiveEntities()
const router = useRouter()
const route = useRoute()

const addCookieHandler = () => {
  // Create cookie
  const cookie = cookieSchema.parse({
    name: '',
    value: '',
    domain: '',
    path: '/',
  })

  // Store cookie
  cookieMutators.add(cookie)

  // Attach cookie to workspace
  workspaceMutators.edit(activeWorkspace.value?.uid ?? '', 'cookies', [
    ...(activeWorkspace.value?.cookies ?? []),
    cookie.uid,
  ])

  // Redirect to the new cookie
  router.push({
    name: 'cookies',
    params: {
      cookies: cookie.uid,
    },
  })
}

const removeCookie = (uid: string) => {
  cookieMutators.delete(uid)

  // Delete cookie from workspace
  workspaceMutators.edit(activeWorkspace.value?.uid ?? '', 'cookies', [
    ...(activeWorkspace.value?.cookies ?? []).filter((c) => c !== uid),
  ])

  // Navigate to the last cookie
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

const handleHotKey = (event?: HotKeyEvent) => {
  if (event?.createNew && route.name === 'cookies') {
    addCookieHandler()
  }
}

const handleNavigation = (event: MouseEvent, uid: string) => {
  // TODO: Use named routes
  const path = `/workspace/default/cookies/${uid}`
  if (event.metaKey) {
    window.open(path, '_blank')
  } else {
    router.push({ path })
  }
}

/** Bind keyboard shortcuts */
onMounted(() => events.hotKeys.on(handleHotKey))
/** Unbind keyboard shortcuts */
onBeforeUnmount(() => events.hotKeys.off(handleHotKey))

const activeCookie = computed<Cookie | undefined>(
  () => cookies[activeCookieId.value],
)

const hasCookies = computed(
  () => Object.keys(cookies).length > 0 && activeCookie.value,
)
</script>
<template>
  <ViewLayout>
    <Sidebar title="Cookies">
      <template #content>
        <div class="flex-1">
          <SidebarList>
            <div
              v-for="cookie in Object.values(cookies)"
              :key="cookie.uid"
              class="flex flex-col gap-1/2">
              <div class="mb-[.5px] last:mb-0 relative">
                <SidebarListElement
                  :key="cookie.uid"
                  class="text-xs"
                  isDeletable
                  type="cookies"
                  :variable="{ name: cookie.name, uid: cookie.uid }"
                  :warningMessage="`Are you sure you want to delete this cookie?`"
                  @click.prevent="handleNavigation($event, cookie.uid)"
                  @delete="removeCookie(cookie.uid)" />
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
      <template v-if="hasCookies">
        <CookieForm />
        <!--  Untested and disabled for now. -->
        <!-- <CookieRaw /> -->
      </template>
    </ViewLayoutContent>
  </ViewLayout>
</template>
