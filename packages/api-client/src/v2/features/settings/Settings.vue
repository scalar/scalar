<script setup lang="ts">
import { cva, cx, ScalarButton, ScalarIcon } from '@scalar/components'
import {
  themeLabels,
  type IntegrationThemeId,
  type ThemeId,
} from '@scalar/themes'

import IntegrationLogo from '@/components/ImportCollection/IntegrationLogo.vue'

import Appearance from './components/Appearance.vue'
import Section from './components/Section.vue'
import { getThemeColors } from './helpers/get-theme-colors'

defineProps<{
  /** Currently active proxy URL, when set to null means no proxy */
  proxyUrl?: string | null
  /** Custom proxy url, when set to null means no custom proxy */
  customProxyUrl?: string | null
  /** Currently active theme ID */
  activeThemeId: ThemeId
  /** Currently active color mode */
  colorMode: 'system' | 'light' | 'dark'
}>()

const emit = defineEmits<{
  (e: 'update:proxyUrl', value: string | null): void
  (e: 'update:themeId', value: ThemeId): void
  (e: 'update:colorMode', value: 'system' | 'light' | 'dark'): void
}>()

const DEFAULT_PROXY_URL = 'https://proxy.scalar.com'

const themeIds: Exclude<ThemeId, IntegrationThemeId>[] = [
  'default',
  'alternate',
  'purple',
  'solarized',
  'saturn',
  'kepler',
]

const integrationThemeIds: IntegrationThemeId[] = ['elysiajs', 'fastify']

const buttonStyles = cva({
  base: 'w-full shadow-none text-c-1 justify-start pl-2 gap-2 border',
  variants: {
    active: {
      true: 'bg-primary text-c-1 hover:bg-inherit',
      false: 'bg-b-1 hover:bg-b-2',
    },
  },
})
</script>
<template>
  <div class="bg-b-1 h-full w-full overflow-auto">
    <div
      class="mr-auto ml-auto flex w-full max-w-[720px] flex-col gap-8 px-5 py-5">
      <!-- Heading -->
      <div>
        <h2 class="mt-10 text-xl font-bold">Settings</h2>
      </div>

      <!-- Proxy -->
      <Section>
        <template #title> CORS Proxy </template>
        <template #description>
          Browsers block cross-origin requests for security. We provide a public
          proxy to
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
                  active: proxyUrl === DEFAULT_PROXY_URL,
                }),
              )
            "
            @click="emit('update:proxyUrl', DEFAULT_PROXY_URL)">
            <div
              class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
              :class="{
                'bg-c-accent text-b-1 border-transparent':
                  proxyUrl === DEFAULT_PROXY_URL,
              }">
              <ScalarIcon
                v-if="proxyUrl === DEFAULT_PROXY_URL"
                icon="Checkmark"
                size="xs"
                thickness="3.5" />
            </div>
            Use proxy.scalar.com (default)
          </ScalarButton>

          <!-- Custom proxy (only if configured) -->
          <ScalarButton
            v-if="customProxyUrl && customProxyUrl !== DEFAULT_PROXY_URL"
            :class="
              cx(
                buttonStyles({
                  active: proxyUrl === customProxyUrl,
                }),
              )
            "
            @click="emit('update:proxyUrl', customProxyUrl)">
            <div
              class="bg-c-accent text-b-1 flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-transparent p-1">
              <ScalarIcon
                v-if="customProxyUrl === proxyUrl"
                icon="Checkmark"
                size="xs"
                thickness="3.5" />
            </div>
            Use custom proxy ({{ customProxyUrl }})
          </ScalarButton>

          <!-- No proxy -->
          <ScalarButton
            :class="cx(buttonStyles({ active: !proxyUrl }))"
            @click="emit('update:proxyUrl', null)">
            <div
              class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
              :class="!proxyUrl && 'bg-c-accent text-b-1 border-transparent'">
              <ScalarIcon
                v-if="!proxyUrl"
                icon="Checkmark"
                size="xs"
                thickness="3.5" />
            </div>
            Skip the proxy
          </ScalarButton>
        </div>
      </Section>

      <!-- Themes -->
      <Section>
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
                    active: activeThemeId === themeId,
                  }),
                )
              "
              @click="emit('update:themeId', themeId)">
              <div class="flex items-center gap-2">
                <div
                  class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
                  :class="{
                    'bg-c-accent text-b-1 border-transparent':
                      activeThemeId === themeId,
                  }">
                  <ScalarIcon
                    v-if="activeThemeId === themeId"
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
      </Section>

      <!-- Frameworks -->
      <Section>
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
                  active: activeThemeId === themeId,
                }),
              )
            "
            @click="emit('update:themeId', themeId)">
            <div class="flex items-center gap-2">
              <div
                class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
                :class="{
                  'bg-c-accent text-b-1 border-transparent':
                    activeThemeId === themeId,
                }">
                <ScalarIcon
                  v-if="activeThemeId === themeId"
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
      </Section>

      <!-- Appearance -->
      <Section>
        <template #title> Appearance </template>
        <template #description>
          Choose between light, dark, or system-based appearance for your
          workspace.
        </template>

        <Appearance
          :colorMode="colorMode"
          @update:colorMode="(value) => emit('update:colorMode', value)" />
      </Section>
    </div>
  </div>
</template>
