<script setup lang="ts">
import { useModal } from '@scalar/components'
import { cookieSchema, type Cookie } from '@scalar/oas-utils/entities/cookie'
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Sidebar } from '@/components'
import EmptyState from '@/components/EmptyState.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type { HotKeyEvent } from '@/libs'
import { PathId } from '@/routes'
import { useActiveEntities, useWorkspace } from '@/store'

import CookieForm from './CookieForm.vue'
import CookieModal from './CookieModal.vue'

// import CookieRaw from './CookieRaw.vue'

const { cookies, cookieMutators, events, workspaceMutators } = useWorkspace()
const { activeWorkspace, activeCookieId } = useActiveEntities()
const router = useRouter()
const route = useRoute()
const cookieModal = useModal()

const addCookieHandler = (cookieData: {
  name: string
  value: string
  domain: string
}) => {
  const cookie = cookieSchema.parse({
    name: cookieData.name,
    value: cookieData.value,
    domain: cookieData.domain,
    path: '/',
  })

  // Store cookie
  cookieMutators.add(cookie)

  // Attach cookie to workspace
  workspaceMutators.edit(activeWorkspace.value?.uid, 'cookies', [
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

const removeCookie = (uid: Cookie['uid']) => {
  cookieMutators.delete(uid)

  // Delete cookie from workspace
  workspaceMutators.edit(activeWorkspace.value?.uid, 'cookies', [
    ...(activeWorkspace.value?.cookies ?? []).filter((c) => c !== uid),
  ])

  // Navigate to the last cookie
  const remainingCookies: Cookie[] = Object.values(cookies).filter(
    (cookie) => (cookie as Cookie).uid !== uid,
  ) as Cookie[]

  if (remainingCookies.length > 0) {
    const lastCookie = remainingCookies[remainingCookies.length - 1]

    if (lastCookie) {
      router.push(lastCookie.uid)
    }
  } else {
    router.push({
      name: 'cookies',
      params: {
        [PathId.Cookies]: 'default',
      },
    })
  }
}

const openCookieModal = () => {
  cookieModal.show()
}

const handleHotKey = (event?: HotKeyEvent) => {
  if (event?.createNew && route.name === 'cookies') {
    openCookieModal()
  }
}

/**
 * Navigate to specific cookies
 */
const handleNavigation = (event: MouseEvent, uid: string) => {
  const to = {
    name: 'cookies',
    params: {
      workspace: activeWorkspace.value?.uid ?? 'default',
      cookies: uid,
    },
  }

  // Open in new tab if meta key is pressed
  if (event.metaKey) {
    const path = router.resolve(to).href

    window.open(path, '_blank')

    return
  }

  router.push(to)
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

watch(
  () => route.query.openCookieModal,
  (newVal) => {
    if (newVal === 'true') {
      openCookieModal()
    }
  },
  { immediate: true },
)
</script>
<template>
  <ViewLayout>
    <Sidebar title="Cookies">
      <template #content>
        <div class="flex-1">
          <SidebarList>
            <li
              v-for="cookie in Object.values(cookies)"
              :key="cookie.uid"
              class="gap-1/2 flex flex-col">
              <div class="relative mb-[.5px] last:mb-0">
                <SidebarListElement
                  :key="cookie.uid"
                  class="text-xs"
                  isDeletable
                  :to="{
                    name: 'cookies',
                    params: {
                      [PathId.Cookies]: cookie.uid,
                    },
                  }"
                  type="cookies"
                  :variable="{ name: cookie.name, uid: cookie.uid }"
                  :warningMessage="`Are you sure you want to delete this cookie?`"
                  @click.prevent="handleNavigation($event, cookie.uid)"
                  @delete="removeCookie(cookie.uid)" />
              </div>
            </li>
          </SidebarList>
        </div>
      </template>
      <template #button>
        <SidebarButton
          :click="openCookieModal"
          hotkey="N">
          <template #title> Add Cookie </template>
        </SidebarButton>
      </template>
    </Sidebar>

    <ViewLayoutContent class="flex-1">
      <template v-if="hasCookies">
        <ViewLayoutSection class="*:border-b-0">
          <template #title>Edit Cookie</template>
          <CookieForm />
          <!--  Untested and disabled for now. -->
          <!-- <CookieRaw /> -->
        </ViewLayoutSection>
      </template>
      <EmptyState v-else />
    </ViewLayoutContent>

    <CookieModal
      :state="cookieModal"
      @cancel="cookieModal.hide()"
      @submit="addCookieHandler" />
  </ViewLayout>
</template>
