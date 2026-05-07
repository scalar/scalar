import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { releaseNotes as bundledReleaseNotes } from '../data/release-notes'
import type { ReleaseNote } from '../types'
import { WHATS_NEW_LAST_SEEN_KEY, buildVisibleNotes, useWhatsNew } from './use-whats-new'

const note = (version: string, title = `release ${version}`): ReleaseNote => ({
  version,
  date: '2026-01-01',
  title,
})

describe('buildVisibleNotes', () => {
  it('hides versions newer than the user installed version', () => {
    const bundled = [note('1.0.0'), note('2.0.0')]
    const result = buildVisibleNotes(bundled, '1.5.0')
    expect(result.map((entry) => entry.version)).toEqual(['1.0.0'])
  })

  it('returns every entry when no current version is provided', () => {
    const bundled = [note('1.0.0'), note('2.0.0')]
    expect(buildVisibleNotes(bundled).map((entry) => entry.version)).toEqual(['2.0.0', '1.0.0'])
  })

  it('orders the visible notes newest first', () => {
    const bundled = [note('1.0.0'), note('1.5.0'), note('1.2.0')]
    const result = buildVisibleNotes(bundled, '2.0.0')
    expect(result.map((entry) => entry.version)).toEqual(['1.5.0', '1.2.0', '1.0.0'])
  })
})

describe('useWhatsNew', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('returns the bundled notes filtered to the current version', () => {
    const { notes } = useWhatsNew({ currentVersion: '999.999.999' })

    expect(notes.value.map((entry) => entry.version)).toEqual(bundledReleaseNotes.map((entry) => entry.version))
  })

  it('hides bundled notes that are newer than the installed version', () => {
    const { notes } = useWhatsNew({ currentVersion: '0.0.1' })

    expect(notes.value).toEqual([])
  })

  it('does not flag unseen entries on a fresh install', () => {
    const { hasUnseen, lastSeenVersion } = useWhatsNew({ currentVersion: '999.999.999' })

    expect(lastSeenVersion.value).toBeNull()
    expect(hasUnseen.value).toBe(false)
  })

  it('flags unseen entries when the stored version is older than the latest visible note', () => {
    localStorage.setItem(WHATS_NEW_LAST_SEEN_KEY, '0.0.1')
    const { hasUnseen } = useWhatsNew({ currentVersion: '999.999.999' })

    expect(hasUnseen.value).toBe(true)
  })

  it('persists the latest visible version when markAllSeen is called', () => {
    localStorage.setItem(WHATS_NEW_LAST_SEEN_KEY, '0.0.1')
    const { latest, markAllSeen, lastSeenVersion } = useWhatsNew({ currentVersion: '999.999.999' })

    expect(latest.value).not.toBeNull()
    markAllSeen()
    expect(lastSeenVersion.value).toBe(latest.value?.version)
    expect(localStorage.getItem(WHATS_NEW_LAST_SEEN_KEY)).toBe(latest.value?.version ?? null)
  })
})
