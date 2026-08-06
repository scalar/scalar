import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'

/**
 * A global cookie collection paired with where it lives, so a selection can be written back to the
 * correct source: the workspace or the active document `x-scalar-cookies` list.
 */
export type GlobalCookieSource = {
  location: 'document' | 'workspace'
  cookies: XScalarCookie[]
}

/**
 * A single cookie within a preset group, carrying just enough to mutate its source: which
 * collection it belongs to and its index within that collection's `x-scalar-cookies` array.
 */
export type GlobalCookieSibling = {
  location: 'document' | 'workspace'
  index: number
  value: string
}

/**
 * Global cookies that share a name, grouped into a single logical cookie. When more than one value
 * exists for the same name the group becomes a preset the user can switch between (for example a
 * `Culture` cookie with `PL` and `EN` values).
 */
export type GlobalCookieGroup = {
  /** The shared cookie name. */
  name: string
  /** The value of the currently active (enabled) sibling — the one that is sent. */
  selectedValue: string
  /** Distinct selectable values, in first-seen order. Only populated for presets. */
  options: string[]
  /** Whether this group offers more than one value to switch between. */
  isPreset: boolean
  /** Location of the first sibling, used to navigate to the global cookie settings. */
  location: 'document' | 'workspace'
  /** Every sibling sharing this name, so a selection can enable one and disable the rest. */
  siblings: GlobalCookieSibling[]
}

/**
 * Groups global cookies by name so duplicate names collapse into a single row. Same-named cookies
 * used to render as independent rows that all shared one disabled state, so toggling one toggled
 * them all. Grouping them lets a name expose its values as a preset switcher instead.
 *
 * The `shouldInclude` predicate applies the caller's domain and path filtering while the original
 * index is still known, so a selection can be written back to the right entry. That predicate
 * deliberately ignores the disabled flag for preset values: a disabled value is only hidden from
 * the request, not from the switcher, so the user can select it again.
 */
export const groupGlobalCookies = ({
  sources,
  shouldInclude,
}: {
  sources: GlobalCookieSource[]
  /** Whether a cookie is applicable to the current request (domain/path), ignoring its disabled state. */
  shouldInclude: (cookie: XScalarCookie) => boolean
}): GlobalCookieGroup[] => {
  /** Names in first-seen order so the rendered rows keep a stable, predictable order. */
  const order: string[] = []
  const grouped = new Map<
    string,
    { location: 'document' | 'workspace'; value: string; isDisabled: boolean; index: number }[]
  >()

  for (const { location, cookies } of sources) {
    cookies.forEach((cookie, index) => {
      if (!cookie.name || !shouldInclude(cookie)) {
        return
      }

      if (!grouped.has(cookie.name)) {
        grouped.set(cookie.name, [])
        order.push(cookie.name)
      }

      grouped.get(cookie.name)?.push({
        location,
        value: cookie.value,
        isDisabled: cookie.isDisabled ?? false,
        index,
      })
    })
  }

  const groups: GlobalCookieGroup[] = []

  for (const name of order) {
    const entries = grouped.get(name) ?? []
    const first = entries[0]
    if (!first) {
      continue
    }

    const enabled = entries.filter((entry) => !entry.isDisabled)
    const options = [...new Set(entries.map((entry) => entry.value))]
    const isPreset = options.length > 1

    // Preserve the previous behavior for plain cookies: a fully disabled single cookie stays hidden
    // from the request view. A preset always renders so its value can be switched back on.
    if (!isPreset && enabled.length === 0) {
      continue
    }

    groups.push({
      name,
      // The enabled sibling is the one that is sent; fall back to the first value when the whole
      // group happens to be disabled so the switcher still has something to show.
      selectedValue: (enabled[0] ?? first).value,
      options: isPreset ? options : [],
      isPreset,
      location: first.location,
      siblings: entries.map(({ location, index, value }) => ({ location, index, value })),
    })
  }

  return groups
}
