<script setup lang="ts">
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'
import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'

const { requiredSecurity } = defineProps<{
  requiredSecurity: RequiredSecurity
}>()

const { translate } = useLocalization()

/**
 * All OAuth scopes required by the operation, de-duplicated and kept in
 * declaration order. Scopes are only populated for OAuth2 / OpenID Connect
 * schemes, so this stays empty for other auth types.
 */
const scopes = computed(() => {
  const collected = new Set<string>()

  for (const group of requiredSecurity.requirements) {
    for (const scheme of group.schemes) {
      for (const scope of scheme.scopes) {
        collected.add(scope)
      }
    }
  }

  return [...collected]
})
</script>

<template>
  <div
    v-if="scopes.length"
    class="mt-6">
    <div class="text-c-1 mt-3 mb-3 text-lg leading-[1.45] font-medium">
      {{ translate('authentication.scopes') }}
    </div>
    <ul class="mb-3 list-none p-0 text-sm">
      <li
        v-for="scope in scopes"
        :key="scope"
        class="font-code text-c-2">
        {{ scope }}
      </li>
    </ul>
  </div>
</template>
