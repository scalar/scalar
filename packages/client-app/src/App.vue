<script setup lang="ts">
import AddressBar from '@/components/AddressBar/AddressBar.vue'
import SideNav from '@/components/SideNav/SideNav.vue'
import TopNav from '@/components/TopNav/TopNav.vue'
import { useDarkModeState } from '@/hooks'
import { useWorkspace } from '@/store/workspace'
import '@scalar/components/style.css'
import {
  REQUEST_METHODS,
  type RequestMethod,
  fetchSpecFromUrl,
} from '@scalar/oas-utils/helpers'
import { ScalarToasts } from '@scalar/use-toasts'
import { onMounted, watchEffect } from 'vue'
import { RouterView } from 'vue-router'

onMounted(() => {
  watchEffect(() => {
    document.body.classList.toggle('dark-mode', isDark.value)
    document.body.classList.toggle('light-mode', !isDark.value)
  })
})

const { isDark } = useDarkModeState()

const { importSpecFile, activeRequest } = useWorkspace()
onMounted(async () => {
  const spec = await fetchSpecFromUrl(
    'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
  )
  importSpecFile(spec)
})
</script>
<template>
  <TopNav />
  <!-- min-h-0 is to allow scrolling of individual flex children -->
  <main class="flex min-h-0 flex-1">
    <SideNav />
    <div class="flex flex-1 flex-col">
      <!-- <AddressBar /> -->
      <RouterView />
    </div>
  </main>
  <ScalarToasts />
</template>
<style>
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--scalar-background-1);
}

/* Main app view wrapper */
.t-app__view {
  flex: 1;
}
</style>
