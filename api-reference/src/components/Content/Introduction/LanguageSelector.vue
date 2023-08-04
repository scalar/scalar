<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { type TargetId, availableTargets } from 'httpsnippet-lite'
import { ref } from 'vue'

import FlowIcon from '@lib/components/FlowIcon.vue'
import ProjectIcon from '@lib/icon-library/ProjectIcon.vue'

import { useTemplateStore } from '../../../stores/template'

type Language = {
  title: string | undefined
  key: Exclude<TargetId, 'http'>
}

// Use the template store to keep it accessible globally
const { state, setItem, getLanguageTitleByKey } = useTemplateStore()

// Check if the given language key is a valid target.
const isValidTargetId = (language: TargetId) =>
  availableTargets()
    .map((target) => target.key)
    .includes(language)

const defaultLanguage = isValidTargetId(state.preferredLanguage)
  ? state.preferredLanguage
  : 'shell'

// Overwrite default setting for preferred language
setItem('preferredLanguage', defaultLanguage)

const selectLanguage = (language: TargetId) => {
  setItem('preferredLanguage', language)

  // Check if selected language is featured already (icon + text)
  const preferedLanguageIsIncluded = !!featuredLanguages.value.filter(
    (preferedLanguage) => {
      return preferedLanguage.key === state.preferredLanguage
    },
  ).length

  // Exit early if the language is already featured
  if (preferedLanguageIsIncluded) {
    return
  }

  // Remove first item and add the preferred language to the end of the list
  featuredLanguages.value = [
    // @ts-ignore
    ...featuredLanguages.value.slice(1),
    {
      title: getLanguageTitleByKey(language),
      // @ts-ignore
      key: language,
    },
  ]
}

const isMobile = useMediaQuery('(max-width: 1000px)')

// Show popular languages with an icon, not just in a select.
const featuredLanguages = ref<Language[]>(
  isMobile.value
    ? // Mobile
      [
        {
          title: 'Shell',
          key: 'shell',
        },
        {
          title: 'Ruby',
          key: 'ruby',
        },
        {
          title: 'Node',
          key: 'node',
        },
        {
          title: 'Python',
          key: 'python',
        },
      ]
    : // Desktop
      [
        {
          title: 'Shell',
          key: 'shell',
        },
        {
          title: 'Ruby',
          key: 'ruby',
        },
        {
          title: 'Node',
          key: 'node',
        },
        {
          title: 'PHP',
          key: 'php',
        },
        {
          title: 'Python',
          key: 'python',
        },
        {
          title: 'C',
          key: 'c',
        },
      ],
)

/**
 * Icons have longer names to appear in icon searches, e.g. "javascript-js" instead of just "javascript". This function
 * maps the language key to the icon name.
 */
const getProjectIconByLanguageKey = (languageKey: TargetId) => {
  const languageKeyMap: Partial<Record<TargetId, string>> = {
    javascript: 'javascript-js',
  }

  const icon = languageKeyMap[languageKey] ?? languageKey

  return `brand/programming-language-${icon}`
}
</script>
<template>
  <div
    v-for="language in featuredLanguages"
    :key="language.key"
    class="code-languages rendered-code-sdks"
    :class="{
      'code-languages__active': state.preferredLanguage === language.key,
    }"
    @click="() => selectLanguage(language.key)">
    <ProjectIcon
      :class="`code-languages-icon code-languages-icon__${language.key}`"
      :src="getProjectIconByLanguageKey(language.key)" />
    <span>{{ language.title }}</span>
  </div>

  <div class="code-languages code-languages__select">
    <select
      :value="state.preferredLanguage"
      @input="
        selectLanguage(($event.target as HTMLSelectElement).value as TargetId)
      ">
      <option disabled>Select language:</option>
      <option
        v-for="target in availableTargets()
          .filter((target) => target.key !== 'http')
          .filter(
            (target) =>
              !featuredLanguages.find(
                (language) => language.key === target.key,
              ),
          )"
        :key="target.key"
        :value="target.key">
        {{ target.title }}
      </option>
    </select>
    <svg
      class="code-languages-icon code-languages-icon__more"
      height="50"
      viewBox="0 0 50 50"
      width="50"
      xmlns="http://www.w3.org/2000/svg">
      <g
        fill="currentColor"
        fill-rule="nonzero">
        <path
          d="M10.71 25.3a3.87 3.87 0 1 0 7.74 0 3.87 3.87 0 0 0-7.74 0M21.13 25.3a3.87 3.87 0 1 0 7.74 0 3.87 3.87 0 0 0-7.74 0M31.55 25.3a3.87 3.87 0 1 0 7.74 0 3.87 3.87 0 0 0-7.74 0" />
      </g>
    </svg>
    <span>More</span>
  </div>
</template>
