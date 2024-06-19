<script setup lang="ts">
import SideNav from '@/components/SideNav/SideNav.vue'
import TopNav from '@/components/TopNav/TopNav.vue'
import { useDarkModeState } from '@/hooks'
import { useWorkspace } from '@/store/workspace'
import { ScalarToasts } from '@scalar/use-toasts'
import { onBeforeMount, onMounted, watchEffect } from 'vue'
import { RouterView } from 'vue-router'

onMounted(() => {
  watchEffect(() => {
    document.body.classList.toggle('dark-mode', isDark.value)
    document.body.classList.toggle('light-mode', !isDark.value)
  })

  /** add scalar-app class to the root component */
  const appElement = document.getElementById('app')
  if (appElement) {
    appElement.classList.add('scalar-app')
  }
})

const { isDark } = useDarkModeState()
const { importSpecFromUrl } = useWorkspace()

onBeforeMount(() => {
  const observer = new MutationObserver((records: MutationRecord[]) => {
    const headlessRoot = records.find((record) =>
      Array.from(record.addedNodes).find(
        (node) => (node as HTMLDivElement).id === 'headlessui-portal-root',
      ),
    )
    if (headlessRoot) {
      ;(headlessRoot.addedNodes[0] as HTMLDivElement).classList.add(
        'scalar-app',
      )
      observer.disconnect()
    }
  })
  observer.observe(document.body, { childList: true })
})

onMounted(() => {
  importSpecFromUrl(
    'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
  )
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
@import '@scalar/components/style.css';
@import './assets/tailwind.css';

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
