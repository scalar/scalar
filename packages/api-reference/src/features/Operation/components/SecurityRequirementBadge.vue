<script setup lang="ts">
import {
  ScalarFloating,
  ScalarFloatingBackdrop,
} from '@scalar/components/floating'
import { ScalarIconLockSimple, ScalarIconLockSimpleOpen } from '@scalar/icons'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { computed, onBeforeUnmount, ref } from 'vue'

import { useLocalization } from '@/features/localization'
import SecurityRequirementBadgeScheme from '@/features/Operation/components/SecurityRequirementBadgeScheme.vue'
import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'

const { requiredSecurity, hideLabel = false } = defineProps<{
  requiredSecurity: RequiredSecurity
  hideLabel?: boolean
}>()
const { translate } = useLocalization()

/**
 * The badge shows a small panel with the security details. It opens on hover
 * and on click, so we own the open state directly instead of leaning on a
 * click-only popover. Owning the state keeps the two interactions from fighting
 * each other: hover and the click of the same gesture (a tap fires both) can no
 * longer toggle each other off.
 */
const triggerRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

/**
 * Whether the panel is pinned open by a click. A pinned panel ignores the
 * pointer leaving so it behaves like the old click-to-open popover, and it only
 * closes on another click, a click outside, or Escape.
 */
const isPinned = ref(false)
let closeTimeout: ReturnType<typeof setTimeout> | undefined

/**
 * Close after a short delay so the pointer can travel across the gap between the
 * badge and the panel without the panel disappearing. A pinned panel stays open.
 */
const scheduleClose = () => {
  if (isPinned.value) {
    return
  }
  clearTimeout(closeTimeout)
  closeTimeout = setTimeout(() => {
    isOpen.value = false
  }, 120)
}

const cancelClose = () => clearTimeout(closeTimeout)

const openOnHover = () => {
  cancelClose()
  isOpen.value = true
}

const close = () => {
  cancelClose()
  isOpen.value = false
  isPinned.value = false
}

/**
 * Toggle on click. A hover already opened the panel (and a tap's `mouseenter`
 * fires just before its `click`), so the first click pins it open rather than
 * closing it; a click on an already pinned panel closes it.
 */
const toggleOnClick = () => {
  if (isPinned.value) {
    close()
    return
  }
  cancelClose()
  isOpen.value = true
  isPinned.value = true
}

onClickOutside(triggerRef, close, { ignore: [panelRef] })
onKeyStroke('Escape', () => {
  if (isOpen.value) {
    close()
  }
})

onBeforeUnmount(() => clearTimeout(closeTimeout))

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
  <ScalarFloating
    v-if="requiredSecurity.state !== 'none'"
    placement="bottom-end">
    <button
      ref="triggerRef"
      class="security-requirement-badge inline-flex w-fit shrink-0 items-center justify-center gap-1 text-sm"
      :class="
        requiredSecurity.state === 'optional'
          ? 'text-c-2'
          : 'text-c-1 font-medium'
      "
      type="button"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      @click.stop="toggleOnClick"
      @mouseenter="openOnHover"
      @mouseleave="scheduleClose">
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
    <template #floating>
      <div
        v-if="isOpen"
        ref="panelRef"
        class="relative flex flex-col p-0.75"
        @mouseenter="cancelClose"
        @mouseleave="scheduleClose">
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
            <template v-else>
              {{ translate('authentication.authentication') }}
            </template>
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
        <ScalarFloatingBackdrop />
      </div>
    </template>
  </ScalarFloating>
</template>
