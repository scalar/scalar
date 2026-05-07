import { compareVersions, isVersionLessThanOrEqual } from '@scalar/helpers/general/compare-versions'
import { safeLocalStorage } from '@scalar/helpers/object/local-storage'
import { type ComputedRef, computed, ref } from 'vue'

import { APP_VERSION } from '@/constants'

import { releaseNotes as bundledReleaseNotes } from '../data/release-notes'
import type { ReleaseNote } from '../types'

/**
 * localStorage key holding the version string of the most recent release the
 * user has acknowledged in the "What's new" modal. Stored as a plain version
 * string (e.g. `"3.5.1"`) so it stays human-readable and forward-compatible.
 *
 * Do NOT change this key without a migration - it would silently re-trigger
 * the "new updates" indicator for every existing user.
 */
export const WHATS_NEW_LAST_SEEN_KEY = 'scalar.whats-new-last-seen'

/**
 * Filter the bundled list to versions the user actually has installed and
 * sort newest first. Pure so it is easy to test in isolation.
 *
 * `currentVersion` is optional because some build targets may not have
 * `APP_VERSION` defined (e.g. unit tests for upstream consumers); in that
 * case we render every entry rather than hiding everything.
 */
export const buildVisibleNotes = (entries: ReleaseNote[], currentVersion?: string): ReleaseNote[] => {
  const filtered = currentVersion
    ? entries.filter((entry) => isVersionLessThanOrEqual(entry.version, currentVersion))
    : entries.slice()
  return filtered.sort((a, b) => compareVersions(b.version, a.version))
}

/** Read the last-seen version from storage, falling back to `null`. */
const readLastSeen = (): string | null => {
  return safeLocalStorage().getItem(WHATS_NEW_LAST_SEEN_KEY)
}

/**
 * Module-scoped reactive state for the most recent acknowledged release.
 *
 * Shared across every `useWhatsNew()` invocation so calling `markAllSeen`
 * from one component (the modal) immediately clears the "new" dot rendered
 * by another (the Get Started launcher) - without this, each call would
 * create its own independent ref and the dot would only refresh after a
 * reload re-read localStorage.
 */
const lastSeenVersionRef = ref<string | null>(readLastSeen())

/**
 * Reactive state for the "What's new" feature.
 */
type UseWhatsNewReturn = {
  /**
   * Release notes the user can actually act on (bundled entries, filtered
   * to versions at or below the installed one, newest first).
   */
  notes: ComputedRef<ReleaseNote[]>
  /** Latest visible entry, or `null` when the list is empty. */
  latest: ComputedRef<ReleaseNote | null>
  /**
   * `true` when the latest visible release has not been acknowledged
   * yet. A user who has never opened the modal (no record in
   * localStorage) is treated as having unseen updates so they notice the
   * dot the first time they land on the Get Started page.
   */
  hasUnseen: ComputedRef<boolean>
  /** Last version the user acknowledged, or `null` if never. */
  lastSeenVersion: ComputedRef<string | null>
  /**
   * Mark all current entries as seen by writing the latest version to
   * localStorage. Safe to call repeatedly; no-op when there are no notes.
   */
  markAllSeen: () => void
}

type UseWhatsNewOptions = {
  /**
   * Override the version used to filter notes. Defaults to the bundled
   * `APP_VERSION` constant - tests pass an explicit value so they do not
   * depend on the package version at the time of the test run.
   */
  currentVersion?: string
}

/**
 * Composable that powers the "What's new" entry point on the Get Started
 * page. The release-notes content is bundled with the package via
 * `RELEASE_NOTES.json` (imported at build time) so the modal works fully
 * offline and stays in sync with the installed version - no network
 * fetch, no CDN, no cache to keep fresh.
 */
export const useWhatsNew = (options: UseWhatsNewOptions = {}): UseWhatsNewReturn => {
  const currentVersion = options.currentVersion ?? APP_VERSION

  // Re-sync the shared ref with localStorage on every invocation. Production
  // code only writes through `markAllSeen` (which keeps the ref and storage
  // in lock-step), so this is normally a no-op - but it lets the composable
  // pick up values written outside its own setter, for example a direct
  // `localStorage.setItem` from a test or a stale value from a previous tab.
  const stored = readLastSeen()
  if (stored !== lastSeenVersionRef.value) {
    lastSeenVersionRef.value = stored
  }

  const notes = computed<ReleaseNote[]>(() => buildVisibleNotes(bundledReleaseNotes, currentVersion))

  const latest = computed<ReleaseNote | null>(() => notes.value[0] ?? null)

  const hasUnseen = computed<boolean>(() => {
    if (!latest.value) {
      return false
    }
    return lastSeenVersionRef.value !== latest.value.version
  })

  const lastSeenVersion = computed<string | null>(() => lastSeenVersionRef.value)

  const markAllSeen = (): void => {
    if (!latest.value) {
      return
    }
    lastSeenVersionRef.value = latest.value.version
    safeLocalStorage().setItem(WHATS_NEW_LAST_SEEN_KEY, latest.value.version)
  }

  return {
    notes,
    latest,
    hasUnseen,
    lastSeenVersion,
    markAllSeen,
  }
}
