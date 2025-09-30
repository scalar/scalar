<script lang="ts" setup>
import {
  ScalarFormInputGroup,
  ScalarFormSection,
  ScalarIcon,
  ScalarToggleInput,
  type Icon as LegacyIcon,
} from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { ref } from 'vue'

import ApiReferenceToolbarBlurb from '@/features/toolbar/ApiReferenceToolbarBlurb.vue'
import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'
import ApiReferenceToolbarRegisterButton from '@/features/toolbar/ApiReferenceToolbarRegisterButton.vue'

const LANGUAGES = [
  {
    key: 'typescript',
    label: 'Typescript',
    icon: 'programming-language-typescript',
  },
  { key: 'python', label: 'Python', icon: 'programming-language-python' },
  { key: 'csharp', label: 'C#', icon: 'programming-language-csharp' },
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

const { workspace } = defineProps<{
  workspace: WorkspaceStore
}>()

const selectedLanguages = ref<LanguageKey[]>([])
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
      <ApiReferenceToolbarRegisterButton
        :sdks="selectedLanguages"
        :workspace="workspace" />
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
