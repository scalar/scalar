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
    // Descriptions can contain links, so do not discard the keyboard user's focus.
    if (panelRef.value?.contains(document.activeElement)) {
      triggerRef.value?.focus()
    }
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

const panelLabel = computed(() =>
  requiredSecurity.state === 'required'
    ? translate('authentication.detailsRequired')
    : translate('authentication.detailsOptional'),
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
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      :aria-label="label"
      class="security-requirement-badge inline-flex w-fit shrink-0 items-center justify-center gap-1 text-sm"
      :class="
        requiredSecurity.state === 'optional'
          ? 'text-c-2'
          : 'text-c-1 font-medium'
      "
      type="button"
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
        :aria-label="panelLabel"
        class="relative flex flex-col p-0.75"
        role="dialog"
        @click.stop
        @mouseenter="cancelClose"
        @mouseleave="scheduleClose">
        <div
          class="flex max-h-[min(32rem,80dvh)] w-80 max-w-[calc(100vw-2rem)] flex-col gap-3 overflow-auto p-3 text-sm wrap-anywhere">
          <div class="font-medium">{{ panelLabel }}</div>
          <div
            v-if="isOrAlternatives || isAndGroup"
            class="text-c-2">
            {{ verb }}
            <template v-if="isOrAlternatives">
              {{ translate('authentication.oneOf') }}
            </template>
            <template v-else-if="isAndGroup">
              {{ translate('authentication.allOf') }}
            </template>
          </div>

          <!-- Multiple OR alternatives -->
          <ul
            v-if="isOrAlternatives"
            class="flex flex-col gap-3">
            <li
              v-for="(group, gi) in requiredSecurity.requirements"
              :key="gi"
              class="flex flex-col gap-2 border-t pt-3">
              <div
                v-if="group.schemes.length > 1"
                class="text-c-2">
                {{ verb }} {{ translate('authentication.allOf') }}
              </div>
              <ul class="flex flex-col gap-3">
                <SecurityRequirementBadgeScheme
                  v-for="(scheme, si) in group.schemes"
                  :key="si"
                  :scheme />
              </ul>
            </li>
          </ul>

          <!-- Single requirement, with one or more schemes. -->
          <ul
            v-else-if="requiredSecurity.requirements[0]"
            class="flex flex-col gap-3">
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
