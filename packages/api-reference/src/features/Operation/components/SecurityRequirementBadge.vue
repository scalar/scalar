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

const verb = computed(() =>
  requiredSecurity.state === 'required' ? 'Requires' : 'Accepts',
)

/** Single group, single scheme — shown inline in the header. */
const isSingleScheme = computed(
  () =>
    requiredSecurity.requirements.length === 1 &&
    requiredSecurity.requirements[0]?.schemes.length === 1,
)

/** Single group with multiple schemes — all must be satisfied (AND). */
const isAndGroup = computed(
  () =>
    requiredSecurity.requirements.length === 1 &&
    (requiredSecurity.requirements[0]?.schemes.length ?? 0) > 1,
)

/** Multiple groups — any one group satisfies authentication (OR). */
const isOrAlternatives = computed(
  () => requiredSecurity.requirements.length > 1,
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
          {{ verb }}
          <template v-if="isSingleScheme">
            <SecurityRequirementBadgeScheme
              is="span"
              class="contents"
              :scheme="requiredSecurity.requirements[0]!.schemes[0]!" />
          </template>
          <template v-else-if="isOrAlternatives">one of:</template>
          <template v-else-if="isAndGroup">all of:</template>
          <template v-else>authentication</template>
        </div>

        <!-- Multiple OR alternatives -->
        <ul
          v-if="isOrAlternatives"
          class="contents">
          <li
            v-for="(group, gi) in requiredSecurity.requirements"
            :key="gi"
            class="markdown">
            <!-- Single scheme in this OR branch -->
            <SecurityRequirementBadgeScheme
              v-if="group.schemes.length === 1"
              is="span"
              class="contents"
              :scheme="group.schemes[0]!" />
            <!-- Multiple AND schemes in this OR branch -->
            <template v-else>
              <ul class="contents">
                <SecurityRequirementBadgeScheme
                  v-for="(scheme, si) in group.schemes"
                  :key="si"
                  :scheme />
              </ul>
            </template>
          </li>
        </ul>

        <!-- Single group, multiple AND schemes -->
        <ul
          v-else-if="isAndGroup"
          class="contents">
          <SecurityRequirementBadgeScheme
            v-for="(scheme, key) in requiredSecurity.requirements[0]!.schemes"
            :key
            :scheme />
        </ul>
      </div>
    </template>
  </ScalarPopover>
</template>
