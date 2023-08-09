<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { type TargetId, availableTargets } from 'httpsnippet-lite'
import { ref } from 'vue'

import { useTemplateStore } from '../../../stores/template'
import { Icon } from '../../Icon'

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

const defaultLanguage = isValidTargetId(state.preferredLanguage as TargetId)
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
const getIconByLanguageKey = (languageKey: TargetId) => {
  const languageKeyMap: Partial<Record<TargetId, string>> = {
    javascript: 'javascript-js',
  }

  const icon = languageKeyMap[languageKey] ?? languageKey

  return `brand/programming-language-${icon}`
}
</script>
<template>
  <div class="client-libraries-content">
    <div
      v-for="language in featuredLanguages"
      :key="language.key"
      class="code-languages rendered-code-sdks"
      :class="{
        'code-languages__active': state.preferredLanguage === language.key,
      }"
      @click="() => selectLanguage(language.key)">
      <Icon
        :class="`code-languages-icon code-languages-icon__${language.key}`"
        :src="getIconByLanguageKey(language.key)" />
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
  </div>
</template>
<style scoped>
.client-libraries-content {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 0 12px;
}
.code-languages {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  max-width: 68px;
  width: 100%;
  padding: 12px 0;
  position: relative;
  cursor: pointer;
  white-space: nowrap;
}
/* remove php and c on mobile */
@media screen and (max-width: 450px) {
  .code-languages:nth-of-type(4),
  .code-languages:nth-of-type(6) {
    display: none;
  }
}
.code-languages-icon {
  max-width: 48px;
  width: 100%;
  max-height: 48px;
  aspect-ratio: 1;
  border-radius: 12px;
  padding: 7px;
  display: flex;
  align-items: center;
  color: #fff;
  justify-content: center;
}
.code-languages-icon__shell {
  background: #000;
  box-shadow: 0 0 0 1px var(--scalar-api-reference-theme-border-color);
}
.code-languages-icon__ruby {
  background: #d91404;
}
.code-languages-icon__php {
  background: #6181b6;
}
.code-languages-icon__python {
  background: #306998;
}
.code-languages-icon__more {
  background: var(--scalar-api-reference-theme-background-3);
}
.code-languages-icon__node {
  background: #83cd29;
}
.code-languages-icon__c {
  background: #03599c;
}
.code-languages-icon__csharp {
  background: #68217a;
}
.code-languages-icon__cplusplus {
  background: #9c033a;
}
.code-languages-icon__clojure {
  background: #5881d8;
}
.code-languages-icon__go {
  background: #00acd7;
}
.code-languages-icon__http {
  background: #005b9b;
}
.code-languages-icon__java {
  background: #ea2d2e;
}
.code-languages-icon__javascript {
  background: #f0db4f;
}
.code-languages-icon__kotlin {
  background: #7f6cb1;
}
.code-languages-icon__objc {
  background: #0b5a9d;
}
.code-languages-icon__ocaml {
  background: #f29100;
}
.code-languages-icon__powershell {
  background: #2671be;
}
.code-languages-icon__r {
  background: #cbced0;
}
.code-languages-icon__swift {
  background: #f05138;
}
.code-languages__loading .code-languages-icon:before {
  border: 1px solid rgba(255, 255, 255, 0.44);
  border-top: 1px solid white;
  animation: codeloader 0.45s linear infinite;
  background: transparent;
  width: 18px;
  height: 18px;
  content: '';
  border-radius: 50%;
}
.code-languages__loading .code-languages-icon svg {
  display: none;
}
.code-languages__active:after {
  content: '';
  position: absolute;
  bottom: 0;
  height: 2px;
  width: 100%;
  background: var(--scalar-api-reference-theme-color-1);
}
@keyframes codeloader {
  0% {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(1turn);
  }
}
.code-languages span {
  margin-top: 3px;
  color: var(--scalar-api-reference-theme-color-2);
  font-size: var(--scalar-api-reference-theme-mini);
}
.code-languages__active span {
  color: var(--scalar-api-reference-theme-color-1);
}
.code-languages__select select {
  opacity: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
}
.code-languages__select span {
  position: relative;
  display: flex;
  align-items: center;
}
.code-languages__select span:after {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--scalar-api-reference-theme-background-1);
  box-shadow: 1px 1px 0 currentColor;
  display: block;
  transform: rotate(45deg);
  margin-left: 5px;
  margin-top: -7px;
}
</style>
