<script setup lang="ts">
import SideNav from '@/components/SideNav/SideNav.vue'
import TopNav from '@/components/TopNav/TopNav.vue'
import { useDarkModeState } from '@/hooks'
import { loadAllResources } from '@/libs'
import { useWorkspace } from '@/store/workspace'
import { addScalarClassesToHeadless } from '@scalar/components'
import { createWorkspace } from '@scalar/oas-utils/entities/workspace'
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
const workspaceStore = useWorkspace()

// Ensure we add our scalar wrapper class to the headless ui root
onBeforeMount(async () => {
  // Check if we have localStorage data
  if (localStorage.getItem(`${LS_KEYS.WORKSPACE}${'default'}`)) {
    // TODO remove this before going live
    console.info('Remove this before going live, but here are the stats: ')
    const size: Record<string, string> = {}
    let _lsTotal = 0
    let _xLen = 0
    let _key = ''

    for (_key in localStorage) {
      if (!Object.prototype.hasOwnProperty.call(localStorage, _key)) {
        continue
      }
      _xLen = (localStorage[_key].length + _key.length) * 2
      _lsTotal += _xLen
      size[_key] = (_xLen / 1024).toFixed(2) + ' KB'
    }
    size['Total'] = (_lsTotal / 1024).toFixed(2) + ' KB'
    console.table(size)

    loadAllResources(workspaceStore)
  } else {
    // Create default workspace
    const _workspace = createWorkspace({
      uid: 'default',
      proxyUrl: 'https://proxy.scalar.com',
    })
    workspaceStore.workspaceMutators.add(_workspace)

    workspaceStore.collectionMutators.add({
      uid: 'drafts',
      spec: {
        info: {
          title: 'Drafts',
        },
      },
    })

    workspaceStore.requestMutators.add(
      { summary: 'My First Request' },
      'drafts',
    )
  }

  addScalarClassesToHeadless()
})
</script>
<template>
  <TopNav />
  <!-- min-h-0 is to allow scrolling of individual flex children -->
  <main class="flex min-h-0 flex-1">
    <SideNav />
    <div class="flex flex-1 flex-col min-w-0">
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
