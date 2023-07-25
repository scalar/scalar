<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { type TargetId, availableTargets } from 'httpsnippet-lite'
import { computed } from 'vue'

import ProjectIcon from '@lib/icon-library/ProjectIcon.vue'

import { useTemplateStore } from '../../../stores/template'

// Use the template store to keep it accessible globally
const { state, setItem } = useTemplateStore()

// Check if the given language key is a valid target.
const isValidTargetId = (language: TargetId) =>
  availableTargets()
    .map((target) => target.key)
    .includes(language)

const defaultLanguage = isValidTargetId(state.preferredLanguage)
  ? state.preferredLanguage
  : state.preferredLanguage

// Overwrite default setting for preferred language
setItem('preferredLanguage', defaultLanguage)

const selectLanguage = (language: TargetId) => {
  setItem('preferredLanguage', language)
}

type Language = {
  title: string
  key: TargetId
}

const isMobile = useMediaQuery('(max-width: 1000px)')

// Show popular languages with an icon, not just in a select.
const popularLanguages = computed<Language[]>(() => {
  if (isMobile.value) {
    return [
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
  }
  return [
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
  ]
})
</script>
<template>
  <div
    v-for="language in popularLanguages"
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

  <div
    class="code-languages code-languages__select"
    :class="{
      'code-languages__active': !popularLanguages.find(
        (language) => language.key === state.preferredLanguage,
      ),
    }">
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
              !popularLanguages.find((language) => language.key === target.key),
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
