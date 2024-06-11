<script setup lang="ts">
import AddressBar from '@/components/AddressBar/AddressBar.vue'
import SideNav from '@/components/SideNav/SideNav.vue'
import TopNav from '@/components/TopNav/TopNav.vue'
import { useDarkModeState } from '@/hooks'
import { useWorkspace } from '@/store/workspace'
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

const getBackgroundColor = () => {
  if (!activeRequest.value) return ''
  const { method } = activeRequest.value
  return REQUEST_METHODS[method as RequestMethod].backgroundColor
}
</script>
<template>
  <TopNav />
  <!-- min-h-0 is to allow scrolling of individual flex children -->
  <main class="flex min-h-0 flex-1">
    <SideNav />
    <div
      class="bg-mix-transparent bg-mix-amount-95 flex flex-1 flex-col rounded-lg rounded-b-none rounded-r-none pt-0"
      :class="getBackgroundColor()"
      style="
        background: linear-gradient(
          color-mix(in srgb, var(--tw-bg-base) 6%, transparent) 1%,
          var(--scalar-background-2) 9%
        );
      ">
      <AddressBar />
      <div
        class="m-1 mt-0 flex min-h-0 flex-1 rounded xl:rounded-lg xl:border xl:overflow-hidden">
        <RouterView />
      </div>
    </div>
  </main>
  <ScalarToasts />
</template>
<style>
@import '@scalar/components/style.css';

@import './assets/reset.css';
@import './assets/scrollbar.css';
@import './assets/tailwind.css';
@import './assets/variables.css';

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
