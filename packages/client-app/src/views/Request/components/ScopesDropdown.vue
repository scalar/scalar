<script setup lang="ts">
import type { UpdateScheme } from '@/store/workspace'
import type { SecuritySchemeOptionOauth } from '@/views/Request/libs'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { SecuritySchemeOauth2 } from '@scalar/oas-utils/entities/workspace/security'
import type { ValueOf } from 'type-fest'
import { computed } from 'vue'

const props = defineProps<{
  activeFlow: ValueOf<SecuritySchemeOauth2['flows']>
  schemeModel: SecuritySchemeOptionOauth
  updateScheme: UpdateScheme
}>()

/** Scope dropdown options */
const scopeOptions = computed(() =>
  Object.entries(props.activeFlow?.scopes ?? {}).map(([key, val]) => ({
    id: key,
    label: [key, val].join(' - '),
  })),
)

/** Handles updating the mutators as well as displaying */
const scopeModel = computed({
  get: () =>
    props.activeFlow?.selectedScopes?.map((scopeName) =>
      scopeOptions.value.find(({ id }) => id === scopeName),
    ),
  set: (opts) =>
    props.updateScheme(
      `flows.${props.schemeModel.flowKey}.selectedScopes`,
      opts?.flatMap((opt) => (opt?.id ? opt.id : [])),
    ),
})
</script>

<template>
  <ScalarListbox
    v-model="scopeModel"
    class="font-code text-xxs w-full"
    fullWidth
    multiple
    :options="scopeOptions"
    teleport>
    <ScalarButton
      class="flex gap-1.5 h-auto px-1.5 text-c-2 font-normal"
      fullWidth
      variant="ghost">
      <span class="tabular-nums">
        Selected
        {{ activeFlow?.selectedScopes?.length || 0 }} /
        {{ Object.keys(activeFlow?.scopes ?? {}).length || 0 }}
      </span>
      <ScalarIcon
        icon="ChevronDown"
        size="xs" />
    </ScalarButton>
  </ScalarListbox>
</template>
