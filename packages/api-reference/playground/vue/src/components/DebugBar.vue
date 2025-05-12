<script setup lang="ts">
import type { ThemeId } from '@scalar/types'
import type { ApiReferenceConfigurationWithSources } from '@scalar/types/api-reference'

import { sources } from '../content/sources'

defineProps<{
  modelValue: Partial<ApiReferenceConfigurationWithSources>
}>()

defineEmits<{
  (
    e: 'update:modelValue',
    value: Partial<ApiReferenceConfigurationWithSources>,
  ): void
}>()

const booleanAttributes = [
  'showSidebar',
  'hideClientButton',
  'isEditable',
  'hideModels',
  'hideDownloadButton',
  'hideTestRequestButton',
  'hideSearch',
  'darkMode',
  'hideDarkModeToggle',
  'withDefaultFonts',
  'defaultOpenAllTags',
] as const

const themes = [
  'alternate',
  'default',
  'moon',
  'purple',
  'solarized',
  'bluePlanet',
  'deepSpace',
  'saturn',
  'kepler',
  'elysiajs',
  'fastify',
  'mars',
  'none',
] as ThemeId[]
</script>

<template>
  <div class="debug-bar text-xs text-white">
    <div class="flex flex-col gap-4">
      <h2 class="border-b border-stone-700 p-4 text-sm font-bold">
        Developer Tools
      </h2>
      <div class="flex flex-col gap-2 px-2">
        <div class="flex flex-col gap-2 rounded-md border border-stone-700 p-2">
          <label class="flex items-center gap-2">
            <span>Layout</span>
            <select
              class="rounded border-stone-700 bg-stone-800 p-1"
              :value="modelValue.layout"
              @change="
                $emit('update:modelValue', {
                  ...modelValue,
                  layout: ($event.target as HTMLSelectElement).value as
                    | 'modern'
                    | 'classic',
                })
              ">
              <option value="modern">modern</option>
              <option value="classic">classic</option>
            </select>
          </label>
        </div>

        <div class="flex flex-col gap-2 rounded-md border border-stone-700 p-2">
          <label class="flex items-center gap-2">
            <span>Theme</span>
            <select
              class="rounded border-stone-700 bg-stone-800 p-1"
              :value="modelValue.theme"
              @change="
                $emit('update:modelValue', {
                  ...modelValue,
                  theme: ($event.target as HTMLSelectElement).value as ThemeId,
                })
              ">
              <option
                v-for="theme in themes"
                :key="theme"
                :value="theme">
                {{ theme }}
              </option>
            </select>
          </label>
        </div>

        <div class="flex flex-col gap-2 rounded-md border border-stone-700 p-2">
          <h3 class="font-bold">Sources</h3>
          <label
            v-for="(source, index) in sources"
            :key="index"
            class="flex items-center gap-2">
            <input
              :checked="
                modelValue.sources?.some(
                  (s) =>
                    (s.url && s.url === source.url) ||
                    (s.content && s.content === source.content),
                )
              "
              class="rounded border-stone-700 bg-stone-800"
              type="checkbox"
              @change="
                $emit('update:modelValue', {
                  ...modelValue,

                  sources: modelValue.sources?.some(
                    (s) =>
                      (s.url && s.url === source.url) ||
                      (s.content && s.content === source.content),
                  )
                    ? modelValue.sources.filter(
                        (s) =>
                          (s.url && s.url !== source.url) ||
                          (s.content && s.content !== source.content),
                      ).length > 0
                      ? modelValue.sources.filter(
                          (s) =>
                            (s.url && s.url !== source.url) ||
                            (s.content && s.content !== source.content),
                        )
                      : []
                    : [
                        ...(modelValue.sources || []),
                        {
                          title: source.title,
                          url: source.url,
                          content: source.content,
                        },
                      ],
                })
              " />
            <span>{{ source.title }}</span>
          </label>
        </div>

        <div class="flex flex-col gap-2 rounded-md border border-stone-700 p-2">
          <label
            v-for="attr in booleanAttributes"
            :key="attr"
            class="flex items-center gap-2">
            <input
              :checked="modelValue[attr]"
              class="rounded border-stone-700 bg-stone-800"
              type="checkbox"
              @change="
                $emit('update:modelValue', {
                  ...modelValue,
                  [attr]: !modelValue[attr],
                })
              " />
            <span>{{
              attr
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase())
            }}</span>
          </label>
        </div>
        <div class="rounded-md border border-stone-700 p-2">
          <pre><code class="block whitespace-pre overflow-x-scroll">{{ modelValue }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
