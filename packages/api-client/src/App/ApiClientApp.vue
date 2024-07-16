<script setup lang="ts">
import SideNav from '@/components/SideNav/SideNav.vue'
import TopNav from '@/components/TopNav/TopNav.vue'
import { useDarkModeState } from '@/hooks'
import { useWorkspace } from '@/store/workspace'
import { addScalarClassesToHeadless } from '@scalar/components'
import { createWorkspace } from '@scalar/oas-utils/entities/workspace'
import { getThemeStyles } from '@scalar/themes'
import { ScalarToasts } from '@scalar/use-toasts'
import { computed, onBeforeMount, onMounted, watchEffect } from 'vue'
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
  // Create default workspace
  const _workspace = createWorkspace({
    uid: 'default',
    // TODO: Make this configurable
    proxyUrl: 'https://proxy.scalar.com',
  })
  workspaceStore.workspaceMutators.add(_workspace)

  workspaceStore.collectionMutators.add(
    {
      uid: 'drafts',
      spec: {
        info: {
          title: 'Drafts',
        },
      },
    },
    'default',
  )

  workspaceStore.requestMutators.add({ summary: 'My First Request' }, 'drafts')

  addScalarClassesToHeadless()
})

const fontsStyleTag = computed(
  () => `<style>
  ${getThemeStyles(workspaceStore.activeWorkspace.value.themeId, {
    fonts: true,
  })}</style>`,
)
</script>
<template>
  <div v-html="fontsStyleTag"></div>
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
@import '../assets/tailwind.css';
@import '../assets/variables.css';

#scalar-client {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--scalar-background-1);
}
</style>
