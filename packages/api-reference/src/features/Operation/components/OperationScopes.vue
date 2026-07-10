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
 * Whether at least one security alternative is satisfied without any OAuth scopes
 * (for example an API key or HTTP bearer). Those alternatives carry no scopes, so they
 * are absent from `scopeGroups`, but their existence means the listed scopes are only
 * required for some auth paths — not mandatory for the operation.
 */
const hasScopeFreeAlternative = computed(() =>
  requiredSecurity.requirements.some((group) =>
    group.schemes.every((scheme) => scheme.scopes.length === 0),
  ),
)

/**
 * Show the "one of" hint whenever the listed scopes are just one of several auth
 * alternatives — either multiple scoped groups, or a single scoped group alongside a
 * scope-free alternative. Without it, a lone scope list would read as mandatory.
 */
const showAlternativesHint = computed(
  () =>
    scopeGroups.value.length > 1 ||
    (scopeGroups.value.length > 0 && hasScopeFreeAlternative.value),
)
</script>

<template>
  <div
    v-if="scopeGroups.length"
    class="mt-6">
    <div class="text-c-1 mt-3 mb-3 text-lg leading-[1.45] font-medium">
      {{ translate('authentication.scopes') }}
    </div>
    <!-- Multiple alternatives (or a scope-free one): satisfying any single alternative is enough (OR). -->
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
