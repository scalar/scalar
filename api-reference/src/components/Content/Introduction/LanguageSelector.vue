<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { type TargetId, availableTargets } from 'httpsnippet-lite'
import { ref } from 'vue'

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
      :src="`brand/programming-language-${language.key}`" />
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

    <ProjectIcon
      class="code-languages-icon code-languages-icon__more"
      src="solid/interface-dots-horizontal" />

    <span>More</span>
  </div>
</template>
