<script setup lang="ts">
import { ScalarPopover } from '@scalar/components'
import { ScalarIconLockSimple, ScalarIconLockSimpleOpen } from '@scalar/icons'
import { computed } from 'vue'

import { Badge } from '@/components/Badge'
import SecurityRequirementBadgeScheme from '@/features/Operation/components/SecurityRequirementBadgeScheme.vue'
import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'

const { requiredSecurity } = defineProps<{
  requiredSecurity: RequiredSecurity
}>()

const label = computed(() =>
  requiredSecurity.state === 'required' ? 'Auth Required' : 'Auth Optional',
)

/**
 * Tooltip content. ScalarTooltip sets `textContent`, so newlines collapse —
 * keep this as a single flowing sentence separated by " · " per scheme.
 * Example: "Requires oauth2 (read:items, write:items) · apiKey"
 */
const authOptions = computed<string[]>(() =>
  requiredSecurity.schemes.map((s) => {
    const typeLabel = s.scheme?.type ? ` (${s.scheme.type})` : ''
    const scopes = s.scopes.length ? ` [${s.scopes.join(', ')}]` : ''
    return `${s.name}${typeLabel}${scopes}`
  }),
)
</script>

<template>
  <ScalarPopover
    v-if="requiredSecurity.state !== 'none'"
    placement="bottom-start">
    <Badge
      is="button"
      class="security-requirement-badge flex w-fit items-center justify-center gap-1"
      :class="requiredSecurity.state === 'optional' ? 'text-c-2' : ''">
      <ScalarIconLockSimple
        v-if="requiredSecurity.state === 'required'"
        class="size-3"
        weight="bold" />
      <ScalarIconLockSimpleOpen
        v-else
        class="size-3"
        weight="bold" />
      {{ label }}
    </Badge>
    <template #popover>
      <div class="flex max-w-xs min-w-48 flex-col gap-1.5 p-2 text-sm">
        <div class="font-medium">
          <template v-if="requiredSecurity.state === 'required'">
            Requires
          </template>
          <template v-else>Accepts </template>
          <template v-if="requiredSecurity.schemes.length > 1">
            one of:
          </template>
          <template
            v-else-if="
              requiredSecurity.schemes.length === 1 &&
              requiredSecurity.schemes[0]
            ">
            <SecurityRequirementBadgeScheme
              is="span"
              class="contents"
              :scheme="requiredSecurity.schemes[0]" />
          </template>
          <template v-else>authentication</template>
        </div>
        <ul
          v-if="requiredSecurity.schemes.length > 1"
          class="contents">
          <SecurityRequirementBadgeScheme
            v-for="(scheme, key) in requiredSecurity.schemes"
            :key
            :scheme />
        </ul>
      </div>
    </template>
  </ScalarPopover>
</template>
