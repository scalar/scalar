<script setup lang="ts">
import { useWorkspace } from '@/store'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { type ThemeId, themeLabels } from '@scalar/themes'

import SettingsGeneralMode from './SettingsGeneralMode.vue'

const { activeWorkspace, workspaceMutators, proxyUrl, setProxyUrl } =
  useWorkspace()

const toggleScalarProxy = () => {
  if (proxyUrl.value) {
    setProxyUrl('')
  } else {
    setProxyUrl('https://proxy.scalar.com')
  }
}

const themeIds: ThemeId[] = [
  'default',
  'alternate',
  'moon',
  'purple',
  'solarized',
  'bluePlanet',
  'saturn',
  'kepler',
  'mars',
  'deepSpace',
]

const getThemeColors = (
  themeId: ThemeId,
): { light: string; dark: string; accent: string } => {
  const colors: Record<
    ThemeId,
    { light: string; dark: string; accent: string }
  > = {
    default: { light: '#fff', dark: '#0f0f0f', accent: '#0099ff' },
    alternate: { light: '#f9f9f9', dark: '#131313', accent: '#e7e7e7' },
    moon: { light: '#ccc9b3', dark: '#313332', accent: '#645b0f' },
    purple: { light: '#f5f6f8', dark: '#22252b', accent: '#5469d4' },
    solarized: { light: '#fdf6e3', dark: '#00212b', accent: '#007acc' },
    bluePlanet: { light: '#f0f2f5', dark: '#000e23', accent: '#e0e2e6' },
    saturn: { light: '#e4e4df', dark: '#2c2c30', accent: '#1763a6' },
    kepler: { light: '#f6f6f6', dark: '#0d0f1e', accent: '#7070ff' },
    mars: { light: '#f2efe8', dark: '#321116', accent: '#c75549' },
    deepSpace: { light: '#f4f4f5', dark: '#09090b', accent: '#8ab4f8' },
    none: { light: '#ffffff', dark: '#000000', accent: '#3b82f6' },
  }
  return (
    colors[themeId] || { light: '#ffffff', dark: '#000000', accent: '#3b82f6' }
  )
}

const changeTheme = (themeId: ThemeId) => {
  workspaceMutators.edit(activeWorkspace.value.uid, 'themeId', themeId)
}
</script>
<template>
  <div class="bg-b-1 w-full h-full overflow-auto">
    <div class="flex flex-col px-5 py-5 max-w-[720px] ml-auto mr-auto w-full">
      <div>
        <div>
          <h2 class="font-bold text-xl mb-5 mt-10">Settings</h2>
          <h3 class="font-bold mb-1">CORS Proxy</h3>
          <!-- <a
            class="hover:text-c-1"
            href="https://github.com/scalar/scalar/tree/main/packages/api-client-proxy"
            target="_blank"
            >open source</a
          > -->
          <p class="text-c-2 mb-2 leading-[21px]">
            Browsers block cross-origin requests for security. We provide a
            public proxy to
            <a
              class="hover:text-c-1 underline-offset-2"
              href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing"
              target="_blank"
              >bypass CORS issues</a
            >. Check the
            <a
              class="hover:text-c-1 underline-offset-2"
              href="https://github.com/scalar/scalar/tree/main/examples/proxy-server"
              target="_blank"
              >source code on GitHub</a
            >.
          </p>
          <div class="gap-2 mt-4 mb-8 flex flex-col">
            <ScalarButton
              class="w-full shadow-none text-c-1 justify-start pl-2 gap-2 bg-b-2 border-1/2"
              :class="{ 'bg-b-1 text-c-1': proxyUrl }"
              :variant="proxyUrl ? 'primary' : 'secondary'"
              @click="setProxyUrl('https://proxy.scalar.com')">
              <div
                class="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] p-1">
                <ScalarIcon
                  v-if="proxyUrl"
                  icon="Checkmark"
                  size="xs"
                  thickness="3.5" />
              </div>
              Use proxy.scalar.com (default)
            </ScalarButton>
            <ScalarButton
              class="w-full shadow-none text-c-1 justify-start pl-2 gap-2 bg-b-2 border-1/2"
              :class="{ 'bg-b-1 text-c-1': !proxyUrl }"
              :variant="!proxyUrl ? 'primary' : 'secondary'"
              @click="setProxyUrl('')">
              <div
                class="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] p-1">
                <ScalarIcon
                  v-if="!proxyUrl"
                  icon="Checkmark"
                  size="xs"
                  thickness="3.5" />
              </div>
              Skip the proxy
            </ScalarButton>
          </div>
        </div>
        <div>
          <h3 class="font-bold mb-1">Theme</h3>
          <p class="text-c-2 mb-4 leading-[21px]">
            We’ve got a whole rainbow of themes for you to play with:
          </p>
          <div class="flex flex-col gap-2">
            <div class="grid grid-cols-2 gap-2">
              <ScalarButton
                v-for="themeId in themeIds"
                :key="themeId"
                class="px-2"
                :class="[
                  'flex items-center justify-between gap-2 text-c-1 border-1/2',
                  activeWorkspace.themeId === themeId ? 'bg-b-1' : 'bg-b-2',
                ]"
                variant="ghost"
                @click="changeTheme(themeId)">
                <div class="flex items-center gap-2">
                  <div
                    class="flex items-center justify-center w-5 h-5 rounded-full border-2 border-c-3"
                    :class="{
                      'bg-primary': activeWorkspace.themeId === themeId,
                    }">
                    <div
                      class="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] p-1">
                      <ScalarIcon
                        v-if="activeWorkspace.themeId === themeId"
                        icon="Checkmark"
                        size="xs"
                        thickness="3.5" />
                    </div>
                  </div>
                  {{ themeLabels[themeId] }}
                </div>
                <div class="flex items-center gap-1">
                  <span
                    class="inline-block w-5 h-5 rounded-full border-c-3 -mr-3"
                    :style="{
                      backgroundColor: getThemeColors(themeId).light,
                    }">
                  </span>
                  <span
                    class="inline-block w-5 h-5 rounded-full border-c-3 -mr-3"
                    :style="{
                      backgroundColor: getThemeColors(themeId).dark,
                    }">
                  </span>
                  <span
                    class="inline-block w-5 h-5 rounded-full border-c-3"
                    :style="{
                      backgroundColor: getThemeColors(themeId).accent,
                    }">
                  </span>
                </div>
              </ScalarButton>
            </div>
          </div>
        </div>
        <div>
          <SettingsGeneralMode />
        </div>
      </div>
    </div>
  </div>
</template>
