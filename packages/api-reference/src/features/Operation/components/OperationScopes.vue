<script setup lang="ts">
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'
import {
  getRequiredScopeGroups,
  type RequiredSecurity,
} from '@/features/Operation/helpers/get-required-security'

const { requiredSecurity } = defineProps<{
  requiredSecurity: RequiredSecurity
}>()

const { translate } = useLocalization()

/**
 * Required OAuth scopes grouped by security alternative (OR). A single group is the
 * common case and renders as a plain list. Multiple groups are kept separate so that
 * mutually exclusive scope sets are not implied to be required all at once.
 */
const scopeGroups = computed(() => getRequiredScopeGroups(requiredSecurity))

/**
 * Show the "one of" hint only when more than one scope group is rendered. Each group
 * becomes its own list, so multiple groups are genuinely alternative sets a reader can
 * choose between. A single group is just listed plainly, even next to a scope-free
 * alternative (for example an API key), since there is nothing to choose between within
 * one already-mandatory set of scopes.
 */
const showAlternativesHint = computed(() => scopeGroups.value.length > 1)
</script>

<template>
  <div
    v-if="scopeGroups.length"
    class="mt-6">
    <div class="text-c-1 mt-3 mb-3 text-lg leading-[1.45] font-medium">
      {{ translate('authentication.scopes') }}
    </div>
    <!-- Multiple scope groups: satisfying any single group is enough (OR). -->
    <div
      v-if="showAlternativesHint"
      class="text-c-2 mb-2 text-sm">
      {{ translate('authentication.oneOf') }}
    </div>
    <ul
      v-for="(group, index) in scopeGroups"
      :key="index"
      class="mb-3 list-none p-0 text-sm"
      :class="{ 'mt-3 border-t pt-3': scopeGroups.length > 1 && index > 0 }">
      <li
        v-for="scope in group"
        :key="scope"
        class="font-code text-c-2">
        {{ scope }}
      </li>
    </ul>
  </div>
</template>
