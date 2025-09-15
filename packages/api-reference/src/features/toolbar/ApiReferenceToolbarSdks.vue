<script lang="ts" setup>
import {
  ScalarFormInputGroup,
  ScalarFormSection,
  ScalarIcon,
  ScalarToggleInput,
  type Icon as LegacyIcon,
} from '@scalar/components'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed, ref } from 'vue'

import ApiReferenceToolbarBlurb from '@/features/toolbar/ApiReferenceToolbarBlurb.vue'
import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'

const LANGUAGES = [
  {
    key: 'typescript',
    label: 'Typescript',
    icon: 'programming-language-typescript',
  },
  { key: 'python', label: 'Python', icon: 'programming-language-python' },
  { key: 'csharp', label: 'C', icon: 'programming-language-csharp' },
  { key: 'java', label: 'Java', icon: 'programming-language-java' },
  { key: 'ruby', label: 'Ruby', icon: 'programming-language-ruby' },
  { key: 'php', label: 'PHP', icon: 'programming-language-php' },
  { key: 'go', label: 'Go', icon: 'programming-language-go' },
] as const satisfies ReadonlyArray<{
  key: string
  icon: LegacyIcon
  label: string
}>

type LanguageKey = (typeof LANGUAGES)[number]['key']

const { configuration } = defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const selectedLanguages = ref<LanguageKey[]>([])

const registrySignupHref = computed<string>(() => {
  const url = new URL('https://dashboard.scalar.com/register')
  url.searchParams.set('url', configuration?.url ?? '')
  selectedLanguages.value.forEach((lang) =>
    url.searchParams.append('sdk', lang),
  )
  return url.toString()
})
</script>
<template>
  <ApiReferenceToolbarPopover class="w-110">
    <template #label>Generate SDKs</template>
    <ScalarFormSection>
      <template #label>Select Languages</template>
      <ScalarFormInputGroup>
        <ScalarToggleInput
          v-for="{ key, label, icon } in LANGUAGES"
          :key
          :modelValue="selectedLanguages.includes(key)"
          @update:modelValue="
            (enabled) =>
              enabled
                ? (selectedLanguages = [...selectedLanguages, key])
                : (selectedLanguages = selectedLanguages.filter(
                    (k) => k !== key,
                  ))
          ">
          <span class="inline-flex items-center gap-2">
            <ScalarIcon
              :icon="icon"
              class="text-c-2 size-3.5" />
            {{ label }}
          </span>
        </ScalarToggleInput>
      </ScalarFormInputGroup>
      <a
        :href="registrySignupHref"
        target="_blank"
        rel="noopener"
        class="bg-b-btn text-c-btn hover:bg-h-btn mt-1 flex items-center justify-center rounded p-2.5 text-sm font-medium">
        Generate
      </a>
      <ApiReferenceToolbarBlurb>
        Generating SDKs is a paid feature starting at $100/mo, learn more in our
        <a
          href="https://guides.scalar.com/scalar/scalar-sdks/getting-started"
          target="_blank">
          guides</a
        >.
      </ApiReferenceToolbarBlurb>
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
