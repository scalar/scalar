/**
 * Arrow-key navigation over the tree layout's disclosure toggles, behind
 * `schemaKeyboardNav`. One delegated keydown per tree root, only for a
 * `[data-schema-toggle]` target with no modifier held. The bindings follow the
 * APG tree pattern, but nothing announces them, so Tab order must stand alone.
 */

/**
 * All toggles under the root that are visible right now. `offsetParent` alone
 * is not enough: a panel kept as `hidden="until-found"` retains its descendants'
 * layout boxes, so their toggles pass that test while `focus()` does nothing.
 */
const visibleToggles = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>('[data-schema-toggle]')].filter(
    (toggle) => toggle.offsetParent !== null && !toggle.closest('[hidden]'),
  )

/** The toggle of the row that owns the panel this toggle's row sits inside. */
const parentToggle = (toggle: HTMLElement): HTMLElement | null =>
  toggle
    .closest('.property-children')
    ?.closest('.property--tree')
    ?.querySelector<HTMLElement>(':scope > [data-schema-toggle]') ?? null

/** The first toggle inside this row's own panel, when one is open. */
const firstChildToggle = (toggle: HTMLElement): HTMLElement | null =>
  toggle.closest('.property--tree')?.querySelector<HTMLElement>(':scope > .property-children [data-schema-toggle]') ??
  null

/**
 * Move focus between tree toggles in response to one keydown.
 *
 * Bind this as a keydown listener on any element that owns tree rows — the
 * schema tree itself, or the response headers group that sits beside one. The
 * listener is delegated, so the element it is bound to defines the set of rows
 * it navigates: `event.currentTarget` is the root, and only the toggles under
 * that root are reachable.
 *
 * It acts only when the event target is a `[data-schema-toggle]` element and no
 * modifier key is held, so typing and browser shortcuts pass through untouched.
 * When it does handle a key it calls `preventDefault`, which doubles as the
 * handoff between nested roots: an inner root marks the event, and any outer
 * delegate the event bubbles to leaves focus where the inner one put it.
 */
export const handleTreeKeydown = (event: KeyboardEvent): void => {
  const target = event.target

  if (
    // A nested tree root already moved focus for this key; the event keeps
    // bubbling to any outer delegate, which must not move it a second time.
    event.defaultPrevented ||
    !(target instanceof HTMLElement) ||
    !target.hasAttribute('data-schema-toggle') ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return
  }

  /*
   * The root is whatever element the listener was bound to, so any surface that
   * owns tree rows can delegate here — the schema tree itself, and the response
   * headers group, which sits beside a tree rather than inside one.
   */
  const root = event.currentTarget instanceof HTMLElement ? event.currentTarget : null

  if (!root) {
    return
  }

  const toggles = visibleToggles(root)
  const index = toggles.indexOf(target)

  if (index === -1) {
    return
  }

  const isExpanded = target.getAttribute('aria-expanded') === 'true'

  switch (event.key) {
    case 'ArrowDown':
      toggles[index + 1]?.focus()
      break
    case 'ArrowUp':
      toggles[index - 1]?.focus()
      break
    case 'ArrowRight':
      if (!isExpanded) {
        target.click()
      } else {
        // Expanded with only leaf children — the majority case — is a no-op.
        firstChildToggle(target)?.focus()
      }
      break
    case 'ArrowLeft':
      if (isExpanded) {
        target.click()
      } else {
        parentToggle(target)?.focus()
      }
      break
    case 'Home':
      toggles[0]?.focus()
      break
    case 'End':
      toggles[toggles.length - 1]?.focus()
      break
    default:
      return
  }

  event.preventDefault()
}
