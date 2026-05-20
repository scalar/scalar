<script lang="ts">
/**
 * Scalar dropdown component
 *
 * @example
 * <ScalarDropdown>
 *   <ScalarButton>Click Me</ScalarButton>
 *   <template #items>
 *     <ScalarDropdownItem>Item 1</ScalarDropdownItem>
 *     <ScalarDropdownItem>Item 2</ScalarDropdownItem>
 *   </template>
 * </ScalarDropdown>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { onClickOutside } from '@vueuse/core'
import { computed, nextTick, ref, useId, watch } from 'vue'

import { ScalarFloating, type ScalarFloatingOptions } from '../ScalarFloating'
import ScalarDropdownMenu from './ScalarDropdownMenu.vue'
import { useDropdown } from './useDropdown'

defineProps<ScalarFloatingOptions>()

defineSlots<{
  /** The reference element for the element in the #floating slot */
  default?(props: {
    /** Whether or not the dropdown is open */
    open: boolean
  }): unknown
  /** The list of dropdown items */
  items?(props: {
    /** Whether or not the dropdown is open */
    open: boolean
  }): unknown
}>()

type ScalarFloatingType = InstanceType<typeof ScalarFloating>
const floatingRef = ref<ScalarFloatingType>()

const menuRef = ref<HTMLUListElement>()

/** Whether or not the dropdown is open */
const open = defineModel<boolean>('open', { default: false })

const { active } = useDropdown()

const fallbackTargetId = useId()
const targetId = ref<string>(fallbackTargetId)
const menuId = useId()

/** Handle click events on the target */
async function handleTargetClick() {
  open.value = !open.value
  await nextTick()
  if (open.value) menuRef.value?.focus()
}

/** Handle keydown events on the target */
async function handleTargetKeydown(event: KeyboardEvent) {
  // Only handle the keys that are relevant to the dropdown
  if (['ArrowDown', 'ArrowUp', ' ', 'Enter'].includes(event.key))
    event.preventDefault()
  else return

  // Open the dropdown if it's not open
  if (!open.value) open.value = true

  // Move the active item if the key is an arrow key or space or enter
  await nextTick()

  // Focus the menu
  menuRef.value?.focus()

  // Move the active item if the key is an arrow key or space or enter
  if (['ArrowDown', ' ', 'Enter'].includes(event.key)) moveActive(1)
  else if (event.key === 'ArrowUp') moveActive(-1)
}

/** Watch the target reference for changes */
watch(
  () => floatingRef.value?.targetRef,
  (newTarget, oldTarget) => {
    if (newTarget) {
      // Create an id for the target if it doesn't have one
      if (newTarget.id) targetId.value = newTarget.id
      else {
        targetId.value = fallbackTargetId
        newTarget.setAttribute('id', targetId.value)
      }
      // Set the aria attributes
      newTarget.setAttribute('aria-haspopup', 'menu')
      newTarget.setAttribute('aria-expanded', `${open.value}`)
      if (open.value) newTarget.setAttribute('aria-controls', menuId)
      // Add the event listeners
      newTarget.addEventListener('click', handleTargetClick)
      newTarget.addEventListener('keydown', handleTargetKeydown)
    }
    if (oldTarget && oldTarget !== newTarget) {
      // Remove the id if it's using the fallback id
      if (oldTarget.id === fallbackTargetId) oldTarget.removeAttribute('id')
      // Remove the aria attributes
      oldTarget.removeAttribute('aria-controls')
      oldTarget.removeAttribute('aria-haspopup')
      oldTarget.removeAttribute('aria-expanded')
      // Remove the event listeners
      oldTarget.removeEventListener('click', handleTargetClick)
      oldTarget.removeEventListener('keydown', handleTargetKeydown)
    }
  },
  { immediate: true },
)

/** Watch the open state for changes */
watch(
  open,
  (o) => {
    const target = floatingRef.value?.targetRef
    if (!target) return
    // Update the aria-expanded attribute on the target
    target.setAttribute('aria-expanded', `${o}`)
    if (o) target.setAttribute('aria-controls', menuId)
    else target.removeAttribute('aria-controls')
  },
  { immediate: true },
)

async function handleClose() {
  // Move focus back to the target
  floatingRef.value?.targetRef?.focus()
  // Close the dropdown
  open.value = false
}

function handleSelected() {
  if (!active.value || !menuRef.value) return

  const button = menuRef.value.querySelector<HTMLElement>(
    `#${active.value}[role="menuitem"]:not([aria-disabled="true"])`,
  )

  if (!button) return

  button.click()

  handleClose()
}

/** Move the active item in the dropdown */
function moveActive(dir: 1 | -1) {
  if (!open.value || !menuRef.value) return

  // Get all menu items, filtering out disabled ones
  const list = Array.from(
    menuRef.value.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])',
    ),
  )

  if (list.length === 0) return

  // Find the current active item's index
  const activeIdx = list.findIndex((item) => item.id === active.value)

  if (activeIdx === -1) {
    // If there is no active item, activate the first or last item
    const targetItem = list[dir > 0 ? 0 : list.length - 1]
    if (targetItem?.id) active.value = targetItem.id
    return
  }

  // Calculate next index and exit if it's out of bounds
  const nextIdx = activeIdx + dir

  if (nextIdx < 0 || nextIdx > list.length - 1) {
    return
  }

  const nextItem = list[nextIdx]

  if (nextItem?.id) active.value = nextItem.id
}

/** Close the dropdown if the user clicks outside of the menu and button */
onClickOutside(menuRef, handleClose, {
  ignore: [computed(() => floatingRef.value?.targetRef)],
})

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <ScalarFloating
    ref="floatingRef"
    v-bind="$props"
    :placement="placement ?? 'bottom-start'">
    <slot :open />
    <template
      v-if="open"
      #floating="{ width }">
      <!-- Background container -->
      <ScalarDropdownMenu
        :style="{ width }"
        v-bind="cx('max-h-[inherit] max-w-[inherit]')">
        <template #menu>
          <div
            :id="menuId"
            ref="menuRef"
            :aria-activedescendant="active"
            :aria-labelledby="targetId"
            class="flex flex-col p-0.75 outline-none"
            role="menu"
            tabindex="-1"
            @click.stop="handleClose"
            @keydown.down.prevent.stop="moveActive(1)"
            @keydown.enter.prevent.stop="handleSelected"
            @keydown.escape.prevent.stop="handleClose"
            @keydown.space.prevent.stop="handleSelected"
            @keydown.tab.prevent.stop="handleClose"
            @keydown.up.prevent.stop="moveActive(-1)">
            <slot
              name="items"
              :open />
          </div>
        </template>
      </ScalarDropdownMenu>
    </template>
  </ScalarFloating>
</template>
