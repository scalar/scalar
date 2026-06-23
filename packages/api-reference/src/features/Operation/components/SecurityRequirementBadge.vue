<script setup lang="ts">
import { ScalarPopover } from '@scalar/components/popover'
import { ScalarIconLockSimple, ScalarIconLockSimpleOpen } from '@scalar/icons'
import { computed } from 'vue'

import { useApiReferenceI18n } from '@/features/i18n'
import SecurityRequirementBadgeScheme from '@/features/Operation/components/SecurityRequirementBadgeScheme.vue'
import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'

const { requiredSecurity, hideLabel = false } = defineProps<{
  requiredSecurity: RequiredSecurity
  hideLabel?: boolean
}>()
const { translate } = useApiReferenceI18n()

const label = computed(() =>
  requiredSecurity.state === 'required'
    ? translate('authentication.required')
    : translate('authentication.optional'),
)

const verb = computed(() =>
  requiredSecurity.state === 'required'
    ? translate('authentication.requires')
    : translate('authentication.accepts'),
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
    placement="bottom-end">
    <button
      class="security-requirement-badge inline-flex w-fit shrink-0 items-center justify-center gap-1 text-sm"
      :class="
        requiredSecurity.state === 'optional'
          ? 'text-c-2'
          : 'text-c-1 font-medium'
      "
      type="button"
      @click.stop>
      <ScalarIconLockSimple
        v-if="requiredSecurity.state === 'required'"
        class="size-3"
        weight="bold" />
      <ScalarIconLockSimpleOpen
        v-else
        class="size-3"
        weight="bold" />
      <span v-if="!hideLabel">{{ label }}</span>
    </button>
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
          <template v-else-if="isOrAlternatives">
            {{ translate('authentication.oneOf') }}
          </template>
          <template v-else-if="isAndGroup">
            {{ translate('authentication.allOf') }}
          </template>
          <template v-else>{{
            translate('authentication.authentication')
          }}</template>
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
              is="span"
              v-if="group.schemes.length === 1"
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
