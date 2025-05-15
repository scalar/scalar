import { autoUpdate, flip, shift, useFloating, type Placement } from '@floating-ui/vue'
import { computed, ref, unref, watch, type MaybeRef } from 'vue'

type MaybeElement = Element | undefined | null

/** The configuration for the active tooltip */
type TooltipConfiguration = {
  content: MaybeRef<string>
  placement?: MaybeRef<Placement>
  delay?: MaybeRef<number>
  offset?: MaybeRef<number>
  targetRef: MaybeRef<MaybeElement>
}

/** Check if mouse moved off the target but onto the tooltip */
function isMovingOffElements(e: Event): boolean {
  const target = unref(config.value?.targetRef)
  if (e instanceof MouseEvent && e.relatedTarget instanceof Element && target) {
    return e.relatedTarget.id !== ELEMENT_ID && e.relatedTarget !== target
  }
  return false
}

/** The ID of the tooltip element used to locate it in the DOM */
const ELEMENT_ID = 'scalar-tooltip' as const

/** The class name of the tooltip element */
const ELEMENT_CLASS = 'scalar-tooltip' as const

/** The default delay for the tooltip */
const DEFAULT_DELAY = 300 as const

type Timer = ReturnType<typeof setTimeout>

/** The delay timer for the tooltip */
const timer = ref<Timer>()

/** A reference to the tooltip element */
const el = ref<HTMLElement>()

/**
 * The configuration for the active tooltip
 *
 * If no tooltip is active it's undefined
 */
const config = ref<TooltipConfiguration>()

console.log('useTooltip File')

// Set up floating UI
const { floatingStyles } = useFloating(
  computed(() => unref(config.value?.targetRef)),
  el,
  {
    placement: computed(() => unref(config.value?.placement)),
    whileElementsMounted: autoUpdate,
    middleware: computed(() => [flip(), shift()]),
  },
)

// Update the tooltip element's positioning when Floating UI updates the styles
watch(floatingStyles, () => {
  if (!el.value) {
    return
  }

  el.value.style.position = floatingStyles.value.position
  el.value.style.top = floatingStyles.value.top
  el.value.style.left = floatingStyles.value.left
  el.value.style.transform = floatingStyles.value.transform ?? ''
  el.value.style.willChange = floatingStyles.value.willChange ?? ''
})

// Show or hide the tooltip when the config changes
watch(config, (opts) => {
  if (!el.value) {
    return
  }

  if (opts) {
    // Update the tooltip content
    el.value.textContent = unref(opts?.content) ?? null

    // Show the tooltip
    const offset = unref(opts?.offset)
    el.value.style.setProperty('--scalar-tooltip-offset', `${offset}px`)
    el.value.style.setProperty('display', 'block')
  } else {
    // Clear the tooltip content
    el.value.textContent = null

    // Hide the tooltip
    el.value.style.removeProperty('--scalar-tooltip-offset')
    el.value.style.setProperty('display', 'none')
  }
})

/**
 * Initialize the tooltip element
 *
 * If the tooltip is already initialized it will be ignored
 */
function initializeTooltipElement() {
  if (el.value) {
    // Tooltip already initialized
    return
  }

  // See if the tooltip element already exists
  // (Sometimes this happens with HMR)
  const existingTooltipElement = document.getElementById(ELEMENT_ID)

  if (existingTooltipElement) {
    el.value = existingTooltipElement
  } else {
    // Create the tooltip element
    el.value = document.createElement('div')
    el.value.role = 'tooltip'
    el.value.id = ELEMENT_ID
    el.value.classList.add(ELEMENT_CLASS)
    el.value.style.setProperty('display', 'none')
    el.value.addEventListener('mouseleave', hideTooltip)
    document.body.appendChild(el.value)
  }
}

/**
 * Show the tooltip after the delay if configured
 */
function showTooltipAfterDelay(_e: Event, opts: TooltipConfiguration) {
  const delay = unref(opts.delay) ?? DEFAULT_DELAY

  clearTimer()

  // Show the tooltip after the delay
  if (delay > 0) {
    timer.value = setTimeout(() => showTooltip(_e, opts), delay)
  } else {
    showTooltip(_e, opts)
  }
}

/**
 * Show the tooltip
 */
function showTooltip(_e: Event, opts: TooltipConfiguration) {
  clearTimer()

  // Handle the escape key
  document.addEventListener('keydown', handleEscape)

  // Show the tooltip
  config.value = opts
}

/**
 * Hide the tooltip
 *
 * If the mouse is moving between the tooltip and the target we don't hide the tooltip
 */
function hideTooltip(_e: Event) {
  if (!isMovingOffElements(_e)) {
    // Don't hide the tooltip if the mouse is moving between the tooltip and the target
    return
  }

  // Clear any existing timer
  clearTimer()

  // Hide the tooltip
  config.value = undefined
  document.removeEventListener('keydown', handleEscape)
}

/**
 * Handle the escape key
 *
 * If the escape key is pressed we need to hide the tooltip
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tooltip_role#keyboard_interactions
 */
function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    hideTooltip(e)
  }
}

/** Clears the current timer */
function clearTimer() {
  if (timer.value) {
    clearTimeout(timer.value)
    timer.value = undefined
  }
}

/**
 * Use the tooltip
 *
 * If the tooltip is not initialized it will be initialized
 */
export function useTooltip(opts: TooltipConfiguration) {
  initializeTooltipElement()

  const showThisTooltipAfterDelay = (e: Event) => showTooltipAfterDelay(e, opts)
  const showThisTooltip = (e: Event) => showTooltip(e, opts)

  watch(
    () => unref(opts.targetRef),
    (newRef, oldRef) => {
      if (oldRef) {
        oldRef.removeEventListener('mouseenter', showThisTooltipAfterDelay)
        oldRef.removeEventListener('mouseleave', hideTooltip)
        oldRef.removeEventListener('focus', showThisTooltip)
        oldRef.removeEventListener('blur', hideTooltip)

        oldRef.removeAttribute('aria-describedby')
      }
      if (newRef) {
        newRef.addEventListener('mouseenter', showThisTooltipAfterDelay)
        newRef.addEventListener('mouseleave', hideTooltip)
        newRef.addEventListener('focus', showThisTooltip)
        newRef.addEventListener('blur', hideTooltip)

        newRef.setAttribute('aria-describedby', ELEMENT_ID)
      }
    },
  )
}
