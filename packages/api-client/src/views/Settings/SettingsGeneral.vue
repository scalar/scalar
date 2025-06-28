<script setup lang="ts">
import { cva, cx, ScalarButton, ScalarIcon } from '@scalar/components'
import {
  themeLabels,
  type IntegrationThemeId,
  type ThemeId,
} from '@scalar/themes'

import IntegrationLogo from '@/components/ImportCollection/IntegrationLogo.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import SettingsGeneralAppearance from './components/SettingsAppearance.vue'
import SettingsSection from './components/SettingsSection.vue'

const { activeWorkspace } = useActiveEntities()
const { proxyUrl, workspaceMutators } = useWorkspace()

const DEFAULT_PROXY_URL = 'https://proxy.scalar.com'

const themeIds: Exclude<ThemeId, IntegrationThemeId>[] = [
  'default',
  'alternate',
  // 'moon',
  'purple',
  'solarized',
  // 'bluePlanet',
  'saturn',
  'kepler',
  // 'mars',
  // 'deepSpace',
  // 'laserwave',
]

const integrationThemeIds: IntegrationThemeId[] = ['elysiajs', 'fastify']

const getThemeColors = (
  themeId: Exclude<ThemeId, IntegrationThemeId>,
): { light: string; dark: string; accent: string } => {
  const colors: Record<
    Exclude<ThemeId, IntegrationThemeId>,
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
    laserwave: { light: '#f4f2f7', dark: '#27212e', accent: '#ed78c2' },
    none: { light: '#ffffff', dark: '#000000', accent: '#3b82f6' },
  }
  return (
    colors[themeId] || { light: '#ffffff', dark: '#000000', accent: '#3b82f6' }
  )
}

const changeTheme = (themeId: ThemeId) =>
  workspaceMutators.edit(activeWorkspace.value?.uid, 'themeId', themeId)

const buttonStyles = cva({
  base: 'w-full shadow-none text-c-1 justify-start pl-2 gap-2 border',
  variants: {
    active: {
      true: 'bg-primary text-c-1 hover:bg-inherit',
      false: 'bg-b-1 hover:bg-b-2',
    },
  },
})

const setProxy = (newProxy: string | undefined) =>
  workspaceMutators.edit(activeWorkspace.value?.uid, 'proxyUrl', newProxy)
</script>
<template>
  <div class="bg-b-1 h-full w-full overflow-auto">
    <div class="mr-auto ml-auto w-full max-w-[720px] px-5 py-5">
      <div class="flex flex-col gap-8">
        <!-- Heading -->
        <div>
          <h2 class="mt-10 text-xl font-bold">Settings</h2>
        </div>

        <!-- Proxy -->
        <SettingsSection>
          <template #title> CORS Proxy </template>
          <template #description>
            Browsers block cross-origin requests for security. We provide a
            public proxy to
            <a
              class="hover:text-c-1 underline-offset-2"
              href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing"
              target="_blank">
              bypass CORS issues
            </a>
            . Check the
            <a
              class="hover:text-c-1 underline-offset-2"
              href="https://github.com/scalar/scalar/tree/main/examples/proxy-server"
              target="_blank">
              source code on GitHub
            </a>
            .
          </template>

          <div class="flex flex-col gap-2">
            <!-- Default proxy -->
            <ScalarButton
              :class="
                cx(
                  buttonStyles({
                    active: activeWorkspace?.proxyUrl === DEFAULT_PROXY_URL,
                  }),
                )
              "
              @click="setProxy(DEFAULT_PROXY_URL)">
              <div
                class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
                :class="{
                  'bg-c-accent text-b-1 border-transparent':
                    activeWorkspace?.proxyUrl === DEFAULT_PROXY_URL,
                }">
                <ScalarIcon
                  v-if="activeWorkspace?.proxyUrl === DEFAULT_PROXY_URL"
                  icon="Checkmark"
                  size="xs"
                  thickness="3.5" />
              </div>
              Use proxy.scalar.com (default)
            </ScalarButton>

            <!-- Custom proxy (only if configured) -->
            <ScalarButton
              v-if="proxyUrl && proxyUrl !== DEFAULT_PROXY_URL"
              :class="
                cx(
                  buttonStyles({
                    active: activeWorkspace?.proxyUrl === proxyUrl,
                  }),
                )
              "
              @click="setProxy(proxyUrl)">
              <div
                class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
                :class="{
                  'bg-c-accent text-b-1 border-transparent':
                    activeWorkspace?.proxyUrl === proxyUrl,
                }">
                <ScalarIcon
                  v-if="activeWorkspace?.proxyUrl === proxyUrl"
                  icon="Checkmark"
                  size="xs"
                  thickness="3.5" />
              </div>
              Use custom proxy ({{ proxyUrl }})
            </ScalarButton>

            <!-- No proxy -->
            <ScalarButton
              :class="cx(buttonStyles({ active: !activeWorkspace?.proxyUrl }))"
              @click="setProxy(undefined)">
              <div
                class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
                :class="
                  !activeWorkspace?.proxyUrl &&
                  'bg-c-accent text-b-1 border-transparent'
                ">
                <ScalarIcon
                  v-if="!activeWorkspace?.proxyUrl"
                  icon="Checkmark"
                  size="xs"
                  thickness="3.5" />
              </div>
              Skip the proxy
            </ScalarButton>
          </div>
        </SettingsSection>

        <!-- Themes -->
        <SettingsSection>
          <template #title> Themes </template>
          <template #description>
            We've got a whole rainbow of themes for you to play with:
          </template>

          <div class="flex flex-col gap-2">
            <div class="grid grid-cols-2 gap-2">
              <ScalarButton
                v-for="themeId in themeIds"
                :key="themeId"
                :class="
                  cx(
                    buttonStyles({
                      active: activeWorkspace?.themeId === themeId,
                    }),
                  )
                "
                @click="changeTheme(themeId)">
                <div class="flex items-center gap-2">
                  <div
                    class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
                    :class="{
                      'bg-c-accent text-b-1 border-transparent':
                        activeWorkspace?.themeId === themeId,
                    }">
                    <ScalarIcon
                      v-if="activeWorkspace?.themeId === themeId"
                      icon="Checkmark"
                      size="xs"
                      thickness="3.5" />
                  </div>
                  {{ themeLabels[themeId] }}
                </div>
                <div class="flex items-center gap-1">
                  <span
                    class="border-c-3 -mr-3 inline-block h-5 w-5 rounded-full"
                    :style="{
                      backgroundColor: getThemeColors(themeId).light,
                    }" />
                  <span
                    class="border-c-3 -mr-3 inline-block h-5 w-5 rounded-full"
                    :style="{
                      backgroundColor: getThemeColors(themeId).dark,
                    }" />
                  <span
                    class="border-c-3 inline-block h-5 w-5 rounded-full"
                    :style="{
                      backgroundColor: getThemeColors(themeId).accent,
                    }" />
                </div>
              </ScalarButton>
            </div>
          </div>
        </SettingsSection>

        <!-- Frameworks -->
        <SettingsSection>
          <template #title> Framework Themes </template>
          <template #description>
            Are you a real fan? Show your support by using your favorite
            framework's theme!
          </template>

          <div class="grid grid-cols-2 gap-2">
            <ScalarButton
              v-for="themeId in integrationThemeIds"
              :key="themeId"
              :class="
                cx(
                  buttonStyles({
                    active: activeWorkspace?.themeId === themeId,
                  }),
                )
              "
              @click="changeTheme(themeId)">
              <div class="flex items-center gap-2">
                <div
                  class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
                  :class="{
                    'bg-c-accent text-b-1 border-transparent':
                      activeWorkspace?.themeId === themeId,
                  }">
                  <ScalarIcon
                    v-if="activeWorkspace?.themeId === themeId"
                    icon="Checkmark"
                    size="xs"
                    thickness="3.5" />
                </div>
                {{ themeLabels[themeId] }}
              </div>
              <div class="flex items-center gap-1">
                <div class="size-7 rounded-xl">
                  <IntegrationLogo :integration="themeId" />
                </div>
              </div>
            </ScalarButton>
          </div>
        </SettingsSection>

        <!-- Appearance -->
        <SettingsSection>
          <template #title> Appearance </template>
          <template #description>
            Choose between light, dark, or system-based appearance for your
            workspace.
          </template>

          <SettingsGeneralAppearance />
        </SettingsSection>
      </div>
    </div>
  </div>
</template>
