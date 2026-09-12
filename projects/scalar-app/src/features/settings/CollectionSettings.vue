<script setup lang="ts">
import { ScalarToggleInput } from '@scalar/components/toggle'
import {
  presets,
  themeLabels,
  type IntegrationThemeId,
  type Theme,
  type ThemeId,
} from '@scalar/themes'
import { computed } from 'vue'

import IntegrationLogo from '@/features/settings/components/IntegrationLogo.vue'

import Appearance from './components/Appearance.vue'
import Section from './components/Section.vue'
import SettingsOption from './components/SettingsOption.vue'
import { getThemeSwatches } from './helpers/get-theme-swatches'

type ColorMode = 'system' | 'light' | 'dark'

const {
  activeProxyUrl,
  customThemes = [],
  activeThemeSlug,
  colorMode,
  telemetry,
} = defineProps<{
  /** Currently active proxy URL, when set to null means no proxy */
  activeProxyUrl?: string | null
  /** Custom themes available to the team */
  customThemes?: Theme[]
  /** Currently active theme ID */
  activeThemeSlug?: string
  /** Currently active color mode */
  colorMode: ColorMode
  /** Whether telemetry is enabled */
  telemetry?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:proxyUrl', value: string | null): void
  (e: 'update:themeSlug', value: string | undefined): void
  (e: 'update:colorMode', value: ColorMode): void
  (e: 'update:telemetry', value: boolean): void
}>()

const DEFAULT_PROXY_URL = 'https://proxy.scalar.com'

const THEME_IDS: Exclude<ThemeId, IntegrationThemeId>[] = [
  'none',
  'default',
  'alternate',
  'purple',
  'solarized',
  'saturn',
  'kepler',
]

const INTEGRATION_THEME_IDS: IntegrationThemeId[] = ['elysiajs', 'fastify']

const defaultThemes = THEME_IDS.map((themeId) => {
  const theme =
    themeId === 'none'
      ? { slug: themeId, name: 'None', description: 'No theme', theme: '' }
      : presets[themeId]

  return { ...theme, swatches: getThemeSwatches(theme.slug) }
})

const integrationThemes = INTEGRATION_THEME_IDS.map((themeId) => ({
  slug: themeId,
  name: themeLabels[themeId],
  description: themeLabels[themeId],
  theme: '',
}))

const customThemeSlugs = computed(
  () => new Set(customThemes.map((theme) => theme.slug)),
)

/**
 * Determines if the "None" theme should be selected.
 * This happens when no theme is selected, or when the selected theme does not exist.
 */
const isNoneThemeSelected = computed(() => {
  if (activeThemeSlug === undefined || activeThemeSlug === 'none') {
    return true
  }

  const isValidTheme =
    customThemeSlugs.value.has(activeThemeSlug) ||
    defaultThemes.some((theme) => theme.slug === activeThemeSlug) ||
    integrationThemes.some((theme) => theme.slug === activeThemeSlug)

  return !isValidTheme
})

const isNoneTheme = (themeId: string): boolean => themeId === 'none'

const isThemeActive = (themeSlug: string): boolean => {
  return (
    activeThemeSlug === themeSlug ||
    (isNoneTheme(themeSlug) && isNoneThemeSelected.value)
  )
}
</script>
<template>
  <div class="flex flex-col gap-10">
    <!-- Proxy -->
    <Section>
      <template #title>CORS Proxy</template>
      <template #description>
        Browsers block cross-origin requests for security. We provide a public
        proxy to
        <a
          class="hover:text-c-1 underline underline-offset-2"
          href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing"
          target="_blank">
          bypass CORS issues
        </a>
        . Check the
        <a
          class="hover:text-c-1 underline underline-offset-2"
          href="https://github.com/scalar/scalar/tree/main/projects/proxy-scalar-com"
          target="_blank">
          source code on GitHub
        </a>
        .
      </template>

      <div class="flex flex-col gap-2">
        <SettingsOption
          :selected="activeProxyUrl === DEFAULT_PROXY_URL"
          @click="emit('update:proxyUrl', DEFAULT_PROXY_URL)">
          Use proxy.scalar.com (default)
        </SettingsOption>

        <SettingsOption
          :selected="!activeProxyUrl"
          @click="emit('update:proxyUrl', null)">
          Skip the proxy
        </SettingsOption>
      </div>
    </Section>

    <!-- Themes -->
    <Section>
      <template #title>Themes</template>
      <template #description>
        We've got a whole rainbow of themes for you to play with:
      </template>

      <div class="grid grid-cols-2 gap-2">
        <SettingsOption
          v-for="theme in defaultThemes"
          :key="theme.slug"
          :selected="isThemeActive(theme.slug)"
          @click="
            emit(
              'update:themeSlug',
              isNoneTheme(theme.slug) ? undefined : theme.slug,
            )
          ">
          {{ theme.name }}

          <template #trailing>
            <span class="flex items-center">
              <span
                v-for="swatch in theme.swatches"
                :key="swatch.label"
                class="border-c-3 -mr-3 inline-block size-5 rounded-full border last:mr-0"
                :style="{ backgroundColor: swatch.color }" />
            </span>
          </template>
        </SettingsOption>
      </div>
    </Section>

    <!-- Frameworks -->
    <Section>
      <template #title>Framework Themes</template>
      <template #description>
        Are you a real fan? Show your support by using your favorite framework's
        theme!
      </template>

      <div class="grid grid-cols-2 gap-2">
        <SettingsOption
          v-for="theme in integrationThemes"
          :key="theme.slug"
          :selected="activeThemeSlug === theme.slug"
          @click="emit('update:themeSlug', theme.slug)">
          {{ theme.name }}

          <template #trailing>
            <span class="block size-7 rounded-xl">
              <IntegrationLogo :integration="theme.slug" />
            </span>
          </template>
        </SettingsOption>
      </div>
    </Section>

    <!-- Custom Themes -->
    <Section v-if="customThemes.length > 0">
      <template #title> Custom Themes </template>
      <template #description>
        Team defined themes are available to all workspaces in the team.
      </template>

      <div class="grid grid-cols-2 gap-2">
        <SettingsOption
          v-for="theme in customThemes"
          :key="theme.slug"
          :selected="activeThemeSlug === theme.slug"
          @click="emit('update:themeSlug', theme.slug)">
          {{ theme.name }}
        </SettingsOption>
      </div>
    </Section>

    <!-- Appearance -->
    <Section>
      <template #title>Appearance</template>
      <template #description>
        Choose between light, dark, or system-based appearance for your
        workspace.
      </template>

      <Appearance
        :colorMode="colorMode"
        @update:colorMode="(value) => emit('update:colorMode', value)" />
    </Section>

    <!-- Telemetry -->
    <Section>
      <template #title>Telemetry</template>
      <template #description>
        Help us improve Scalar by sending usage data.
      </template>

      <ScalarToggleInput
        :modelValue="telemetry"
        @update:modelValue="
          (value) => emit('update:telemetry', value ?? false)
        ">
        Enable telemetry
      </ScalarToggleInput>
    </Section>
  </div>
</template>
