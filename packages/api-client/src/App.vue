<script setup lang="ts">
import SideNav from '@/components/SideNav/SideNav.vue'
import TopNav from '@/components/TopNav/TopNav.vue'
import { useDarkModeState } from '@/hooks'
import { useWorkspace } from '@/store/workspace'
import { addScalarClassesToHeadless } from '@scalar/components'
import { LS_KEYS } from '@scalar/object-utils/mutator-record'
import { ScalarToasts } from '@scalar/use-toasts'
import { onBeforeMount, onMounted, watchEffect } from 'vue'
import { RouterView } from 'vue-router'

onMounted(() => {
  watchEffect(() => {
    document.body.classList.toggle('dark-mode', isDark.value)
    document.body.classList.toggle('light-mode', !isDark.value)
  })
})

const { isDark } = useDarkModeState()
const { importSpecFromUrl, workspaceMutators } = useWorkspace()

workspaceMutators.edit('proxyUrl', 'https://proxy.scalar.com')

// Ensure we add our scalar wrapper class to the headless ui root
onBeforeMount(async () => {
  // Check if we have localStorage data
  const workspace = localStorage.getItem(LS_KEYS.WORKSPACE)
  console.log({ workspace })

  // eslint-disable-next-line no-constant-condition
  if (false && workspace) {
    console.log('=====')
    console.log(workspace)
    // Get raw mutator.add so no fancy business
  } else {
    importSpecFromUrl(
      // 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
      'https://developer.spotify.com/reference/web-api/open-api-schema.yaml',
      'https://proxy.scalar.com',
    )
  }

  addScalarClassesToHeadless()
})

onBeforeMount(() => {})
</script>
<template>
  <TopNav />
  <!-- min-h-0 is to allow scrolling of individual flex children -->
  <main class="flex min-h-0 flex-1">
    <SideNav />
    <div class="flex flex-1 flex-col min-w-0">
      <!-- <AddressBar /> -->
      <RouterView />
    </div>
  </main>
  <ScalarToasts />
</template>
<style>
@import '@scalar/components/style.css';
@import '@scalar/themes/style.css';
@import './assets/tailwind.css';
@import './assets/variables.css';

#scalar-client {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--scalar-background-1);
}
</style>
