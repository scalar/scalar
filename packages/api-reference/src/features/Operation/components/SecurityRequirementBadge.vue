<script setup lang="ts">
import { ScalarTooltip } from '@scalar/components'
import { ScalarIconLockSimple, ScalarIconLockSimpleOpen } from '@scalar/icons'
import { computed } from 'vue'

import { Badge } from '@/components/Badge'
import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'

const { requiredSecurity } = defineProps<{
  requiredSecurity: RequiredSecurity
}>()

const label = computed(() =>
  requiredSecurity.state === 'required' ? 'auth required' : 'auth optional',
)

/**
 * Tooltip content. ScalarTooltip sets `textContent`, so newlines collapse —
 * keep this as a single flowing sentence separated by " · " per scheme.
 * Example: "Requires oauth2 (read:items, write:items) · apiKey"
 */
const tooltipContent = computed(() => {
  const verb = requiredSecurity.state === 'required' ? 'Requires' : 'Accepts'

  if (requiredSecurity.schemes.length === 0) {
    return requiredSecurity.state === 'required'
      ? 'Authentication required'
      : 'Authentication optional'
  }

  const parts = requiredSecurity.schemes.map((s) => {
    const typeLabel = s.scheme?.type ? ` (${s.scheme.type})` : ''
    const scopes = s.scopes.length ? ` [${s.scopes.join(', ')}]` : ''
    return `${s.name}${typeLabel}${scopes}`
  })

  return `${verb} ${parts.join(' · ')}`
})
</script>

<template>
  <ScalarTooltip
    v-if="requiredSecurity.state !== 'none'"
    :content="tooltipContent">
    <Badge
      class="security-requirement-badge font-code flex w-fit items-center justify-center gap-1"
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
  </ScalarTooltip>
</template>
