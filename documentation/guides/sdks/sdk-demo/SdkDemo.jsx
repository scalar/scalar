import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  ADDITIONAL_TARGETS,
  API_DOCUMENT,
  BUILD_LOG,
  INITIAL_TARGETS,
  PAGE_URLS,
  SHARE_HOST,
  SHARE_MESSAGE,
  SHARE_TEXT,
  SHARE_TITLE,
  SHARE_URL,
  SITE_EMBED,
  SLACK_URL,
  TARGETS,
  VIDEO_EMBED,
} from './data.js'
import { MARKDOWN_RULES, YAML_RULES, codeRules, highlight } from './highlight.jsx'
import { SDK_DEMO_STYLES } from './styles.js'
import { raiseWindow, resetPosition, useDraggable } from './use-draggable.js'

const PANEL_TABS = [
  ['quickstart', 'Quickstart'],
  ['reference', 'api.md'],
  ['skill', 'SKILL.md'],
  ['files', 'Files'],
]

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const MAILTO_HREF = `mailto:?subject=${encodeURIComponent(SHARE_TITLE)}&body=${encodeURIComponent(
  `${SHARE_TEXT}\n\n${SHARE_URL}`,
)}`

const SMS_HREF = `sms:?&body=${encodeURIComponent(`${SHARE_TITLE}\n${SHARE_URL}`)}`

/** Put `text` on the clipboard. False when the browser refuses. */
const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    /* Denied clipboard, an insecure origin, or an older browser. */
    return false
  }
}

/**
 * The SDK Generator, running against a fictional HR API called Warp.
 *
 * Nothing here talks to a server. The component renders its resting state on
 * the server, so the page reads correctly before — and without — hydration;
 * every transition below is what React takes over once it mounts.
 */
export function SdkDemo() {
  /* Dashboard state. */
  const [installed, setInstalled] = useState(() => [...INITIAL_TARGETS])
  const [selected, setSelected] = useState('typescript')
  const [tab, setTab] = useState('quickstart')
  const [menuOpen, setMenuOpen] = useState(false)

  /* The simulated generation run. */
  const [build, setBuild] = useState('live')
  const [version, setVersion] = useState('1.4.0')
  const [builtAt, setBuiltAt] = useState('4 minutes ago')
  const [logIndex, setLogIndex] = useState(0)

  /* Floating windows. */
  const [buildOpen, setBuildOpen] = useState(false)
  const [apiOpen, setApiOpen] = useState(false)

  /* Browser chrome: tabs, overview, share sheet. */
  const [page, setPage] = useState('dashboard')
  const [siteRevealed, setSiteRevealed] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [siteLoaded, setSiteLoaded] = useState(false)
  const [overviewOpen, setOverviewOpen] = useState(false)
  const [tabQuery, setTabQuery] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [copyLabel, setCopyLabel] = useState('Copy')

  /*
   * The hint only makes sense once the component is interactive, so it starts
   * hidden and is switched on after mount. That also keeps the server HTML and
   * the first client render identical, which is what hydration compares.
   */
  const [hintVisible, setHintVisible] = useState(false)

  const rootRef = useRef(null)
  const frameRef = useRef(null)
  const chromeRef = useRef(null)
  const buildWindowRef = useRef(null)
  const buildBarRef = useRef(null)
  const apiWindowRef = useRef(null)
  const apiBarRef = useRef(null)
  const logRef = useRef(null)
  const tabRefs = useRef({})
  const buildingRef = useRef(false)

  /* Every timer the demo starts, so a reset or an unmount can cancel them. */
  const timersRef = useRef(new Set())

  const later = useCallback((fn, delay) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id)
      fn()
    }, delay)
    timersRef.current.add(id)
    return id
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current.clear()
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  useEffect(() => setHintVisible(true), [])

  const hideHint = useCallback(() => setHintVisible(false), [])

  /* Every window moves like a window: grab the title bar and drag. */
  useDraggable(frameRef, chromeRef)
  useDraggable(buildWindowRef, buildBarRef)
  useDraggable(apiWindowRef, apiBarRef)

  const config = TARGETS[selected]
  const running = build === 'running'

  /* --------------------------------------------------------------------
     The build run
     -------------------------------------------------------------------- */

  const finishBuild = useCallback(() => {
    buildingRef.current = false
    setVersion((current) => {
      const [major, minor] = current.split('.')
      return `${major}.${Number(minor) + 1}.0`
    })
    setBuild('live')
    setBuiltAt('just now')
  }, [])

  const runBuild = useCallback(() => {
    if (buildingRef.current) {
      return
    }

    clearTimers()
    setMenuOpen(false)
    buildingRef.current = true
    setBuild('running')
    setLogIndex(0)
    setBuildOpen(true)
    raiseWindow(buildWindowRef.current)

    /* With reduced motion the run still happens, it just lands at once. */
    if (prefersReducedMotion()) {
      setLogIndex(BUILD_LOG.length)
      finishBuild()
      return
    }

    const step = (index) => {
      if (index >= BUILD_LOG.length) {
        finishBuild()
        return
      }
      setLogIndex(index + 1)
      later(() => step(index + 1), BUILD_LOG[index][1])
    }

    later(() => step(0), 260)
  }, [clearTimers, finishBuild, later])

  /* The newest line keeps the log scrolled to the bottom. */
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logIndex, build])

  const progress = logIndex / BUILD_LOG.length
  const steps = [
    ['Codegen', running ? progress > 0.75 : true],
    ['Build', running ? progress >= 1 : true],
  ]

  const statusMap = {
    live: ['Build live', 'sdk-demo-dot-green'],
    running: ['Building', 'sdk-demo-dot-amber'],
    queued: ['Queued', 'sdk-demo-dot-amber'],
  }
  const [statusLabel, statusDotClass] = statusMap[build] ?? statusMap.live

  /* --------------------------------------------------------------------
     Windows and tabs
     -------------------------------------------------------------------- */

  const toggleApiWindow = () => {
    const open = !apiOpen
    setApiOpen(open)
    if (open) {
      raiseWindow(apiWindowRef.current)
    }
  }

  const showPage = useCallback((next) => {
    setPage(next)
    /* Load each embed on first visit, and never before. */
    if (next === 'video') {
      setVideoLoaded(true)
    }
    if (next === 'site') {
      setSiteLoaded(true)
    }
  }, [])

  const openOverview = (open) => {
    setOverviewOpen(open)
    if (open) {
      hideHint()
    } else {
      setTabQuery('')
    }
  }

  /* Both "+" buttons — the omnibar's and the overview's — open the third tab
   * the first time, and switch to it after that. */
  const openSiteTab = () => {
    setSiteRevealed(true)
    showPage('site')
    openOverview(false)
  }

  const openShare = (open) => {
    setShareOpen(open)
    if (open) {
      hideHint()
    } else {
      /* Leave the sheet in its resting state for the next open. */
      setCopyLabel('Copy')
      setShareStatus('')
    }
  }

  const reset = () => {
    clearTimers()
    buildingRef.current = false
    setMenuOpen(false)
    setBuildOpen(false)
    setApiOpen(false)
    setOverviewOpen(false)
    setShareOpen(false)
    setSiteRevealed(false)
    setPage('dashboard')
    resetPosition(frameRef.current)
    resetPosition(buildWindowRef.current)
    resetPosition(apiWindowRef.current)
    setInstalled([...INITIAL_TARGETS])
    setSelected('typescript')
    setTab('quickstart')
    setVersion('1.4.0')
    setBuild('live')
    setBuiltAt('4 minutes ago')
    setLogIndex(0)
    setTabQuery('')
    setShareStatus('')
    setCopyLabel('Copy')
    setHintVisible(true)
  }

  /* --------------------------------------------------------------------
     Share sheet
     -------------------------------------------------------------------- */

  const announceShare = (message) => {
    setShareStatus(message)
    later(() => setShareStatus(''), 2600)
  }

  /*
   * Neither Slack nor Apple Notes exposes a compose-with-text URL to a web
   * page, so neither can be handed the message directly.
   *
   * Slack gets as close as the web allows: the message goes to the clipboard
   * and Slack opens, ready to paste.
   *
   * Notes has no address at all, so the only real route to it is the system
   * share sheet, where Notes is a genuine target. That has to be called
   * straight from the click — awaiting anything first spends the user
   * gesture Safari requires — with the clipboard as the fallback elsewhere.
   */
  const shareViaSystem = async () => {
    if (!navigator.share) {
      return 'unsupported'
    }

    try {
      await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL })
      return 'shared'
    } catch (error) {
      return error?.name === 'AbortError' ? 'cancelled' : 'unsupported'
    }
  }

  const handlePasteShare = async (app) => {
    if (app === 'Notes') {
      const outcome = await shareViaSystem()

      if (outcome === 'shared') {
        announceShare('Shared')
        later(() => openShare(false), 1000)
        return
      }
      if (outcome === 'cancelled') {
        return
      }
    }

    /* Opened before the clipboard write, not after: both need the click's
     * transient activation, and awaiting the clipboard spends it — the
     * window then gets blocked as an unsolicited popup. */
    if (app === 'Slack') {
      window.open(SLACK_URL, '_blank', 'noopener,noreferrer')
    }

    const copied = await copyText(SHARE_MESSAGE)

    announceShare(copied ? `Message copied — paste it into ${app}` : `Could not copy the message for ${app}`)
  }

  /* Mail and Messages navigate on their own; this only reports it, and gets
   * out of the way so the handover is visible. */
  const handleLinkShare = (app) => {
    announceShare(`Opening ${app}…`)
    later(() => openShare(false), 1200)
  }

  const handleCopy = async () => {
    /* iOS "Copy" copies the link, not the whole message. */
    setCopyLabel((await copyText(SHARE_URL)) ? 'Copied' : 'Copy failed')
    later(() => setCopyLabel('Copy'), 1600)
  }

  /* --------------------------------------------------------------------
     Document-level keys and clicks
     -------------------------------------------------------------------- */

  useEffect(() => {
    const onClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    const onKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return
      }
      if (shareOpen) {
        openShare(false)
      } else if (overviewOpen) {
        openOverview(false)
      } else if (menuOpen) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  })

  /* Left and right arrows move between tabs, as a tablist should. */
  const onTablistKeyDown = (event) => {
    let offset = 0
    if (event.key === 'ArrowRight') {
      offset = 1
    } else if (event.key === 'ArrowLeft') {
      offset = -1
    } else {
      return
    }
    event.preventDefault()
    const index = PANEL_TABS.findIndex(([key]) => key === tab)
    const [next] = PANEL_TABS[(index + offset + PANEL_TABS.length) % PANEL_TABS.length]
    setTab(next)
    tabRefs.current[next]?.focus()
  }

  /* --------------------------------------------------------------------
     Derived view data
     -------------------------------------------------------------------- */

  const available = ADDITIONAL_TARGETS.filter((key) => !installed.includes(key))
  const showFiles = tab === 'files'

  const codeTitle = {
    quickstart: config.quickstartFile,
    reference: 'api.md',
    skill: 'SKILL.md',
    files: `${config.files.filter((file) => file.kind !== 'dir').length} files generated`,
  }[tab]

  /* Quickstart is source; the other two tabs are markdown. */
  const codeBody = useMemo(() => {
    if (showFiles) {
      return null
    }
    const body = { quickstart: config.quickstart, reference: config.reference, skill: config.skill }[tab]
    const rules = tab === 'quickstart' ? codeRules(selected) : MARKDOWN_RULES
    return highlight(body ?? config.quickstart, rules)
  }, [config, selected, showFiles, tab])

  const apiDoc = useMemo(() => highlight(API_DOCUMENT, YAML_RULES), [])

  const needle = tabQuery.trim().toLowerCase()
  const tabCardHidden = (title) => Boolean(needle) && !title.toLowerCase().includes(needle)

  const urlText = overviewOpen ? 'Search or enter website name' : (PAGE_URLS[page] ?? PAGE_URLS.dashboard)

  return (
    <div
      className="sdk-demo"
      data-sdk-demo-menu={menuOpen ? 'open' : 'closed'}
      data-sdk-demo-page={page}
      data-sdk-demo-state={build}
      onFocus={hideHint}
      onPointerDown={hideHint}
      ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: SDK_DEMO_STYLES }} />
      <div className="sdk-demo-stage">
        <div
          className="sdk-demo-frame"
          ref={frameRef}>
          <div
            className="sdk-demo-chrome"
            ref={chromeRef}>
            <div
              aria-hidden="true"
              className="sdk-demo-chrome-lights"></div>
            <div
              aria-hidden="true"
              className="sdk-demo-chrome-left">
              <svg
                fill="currentColor"
                height="16"
                viewBox="0 0 20 16"
                width="20">
                <path
                  clipRule="evenodd"
                  d="M19.4 15.4a2 2 0 0 1-1.4.6H2a2 2 0 0 1-1.4-.6A2 2 0 0 1 0 14V2C0 1.4.2 1 .6.6A2 2 0 0 1 2 0h16c.6 0 1 .2 1.4.6.4.4.6.8.6 1.4v12c0 .6-.2 1-.6 1.4ZM2 14h5V2H2v12Zm7 0h9V2H9v12ZM3.3 3c-.2 0-.3.2-.3.3v1c0 .2.1.3.3.3h2.5c.1 0 .2-.1.2-.3v-1l-.2-.2H3.3Zm0 2c-.2 0-.3.2-.3.3v1c0 .2.1.3.3.3h2.5c.1 0 .2-.1.2-.3v-1l-.2-.2H3.3ZM3 7.4c0-.1.1-.2.3-.2h2.5c.1 0 .2 0 .2.2v1c0 .2-.1.3-.2.3H3.3a.3.3 0 0 1-.3-.3v-1Z"
                  fillRule="evenodd"
                />
              </svg>
              <svg
                fill="currentColor"
                height="24"
                viewBox="0 0 24 24"
                width="24">
                <path d="M16 22 6 12 16 2l1.8 1.8L9.5 12l8.3 8.2L16 22Z" />
              </svg>
              <svg
                fill="currentColor"
                height="24"
                viewBox="0 0 24 24"
                width="24">
                <path d="m8 22 10-10L8 2 6.2 3.8l8.3 8.2-8.3 8.2L8 22Z" />
              </svg>
            </div>
            <div className="sdk-demo-chrome-nav">
              <div className="sdk-demo-chrome-url">
                <svg
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M7 10H15V6C15 5.16667 14.7083 4.45833 14.125 3.875C13.5417 3.29167 12.8333 3 12 3C11.1667 3 10.4583 3.29167 9.875 3.875C9.29167 4.45833 9 5.16667 9 6V10H7V6C7 4.61667 7.4875 3.4375 8.4625 2.4625C9.4375 1.4875 10.6167 1 12 1C13.3833 1 14.5625 1.4875 15.5375 2.4625C16.5125 3.4375 17 4.61667 17 6V10C17.55 10 18.0208 10.1958 18.4125 10.5875C18.8042 10.9792 19 11.45 19 12V20C19 20.55 18.8042 21.0208 18.4125 21.4125C18.0208 21.8042 17.55 22 17 22H7C6.45 22 5.97917 21.8042 5.5875 21.4125C5.19583 21.0208 5 20.55 5 20V12C5 11.45 5.19583 10.9792 5.5875 10.5875C5.97917 10.1958 6.45 10 7 10Z" />
                </svg>
                <span>{urlText}</span>
                <button
                  aria-label="Reload and reset the demo"
                  onClick={reset}
                  type="button">
                  <svg
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 24 24">
                    <path d="M12 22a8.7 8.7 0 0 0 6.4-2.6A9.1 9.1 0 0 0 21 13h-2c0 2-.7 3.6-2 5-1.4 1.3-3 2-5 2s-3.6-.7-5-2c-1.3-1.4-2-3-2-5s.7-3.6 2-5c1.4-1.3 3-2 5-2h.2l-1.6 1.5L12 9l4-4-4-4-1.4 1.5L12.2 4H12a8.7 8.7 0 0 0-6.4 2.6A9.1 9.1 0 0 0 3 13a8.7 8.7 0 0 0 2.6 6.4A9.1 9.1 0 0 0 12 22Z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="sdk-demo-chrome-right">
              <button
                aria-expanded={shareOpen}
                aria-label="Share"
                className="sdk-demo-chrome-button"
                onClick={() => openShare(!shareOpen)}
                type="button">
                <svg
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M6 23a2 2 0 0 1-1.4-.6A2 2 0 0 1 4 21V10c0-.6.2-1 .6-1.4A2 2 0 0 1 6 8h3v2H6v11h12V10h-3V8h3c.6 0 1 .2 1.4.6.4.4.6.8.6 1.4v11c0 .6-.2 1-.6 1.4a2 2 0 0 1-1.4.6H6Zm5-7V4.8L9.4 6.4 8 5l4-4 4 4-1.4 1.4L13 4.8V16h-2Z" />
                </svg>
              </button>
              <button
                aria-label="New tab"
                className="sdk-demo-chrome-button"
                onClick={openSiteTab}
                type="button">
                <svg
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2v-6Z" />
                </svg>
              </button>
              <button
                aria-expanded={overviewOpen}
                aria-label="Show tabs"
                className="sdk-demo-chrome-button"
                onClick={() => openOverview(!overviewOpen)}
                type="button">
                <svg
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M8 22a2 2 0 0 1-1.4-.6A2 2 0 0 1 6 20v-2H4a2 2 0 0 1-1.4-.6A2 2 0 0 1 2 16V6h2v10h2V8c0-.5.2-1 .6-1.4A2 2 0 0 1 8 6h8V4H6V2h10c.6 0 1 .2 1.4.6.4.4.6.9.6 1.4v2h2c.6 0 1 .2 1.4.6.4.4.6.9.6 1.4v12c0 .6-.2 1-.6 1.4a2 2 0 0 1-1.4.6H8Zm0-2h12V8H8v12ZM2 6V4c0-.5.2-1 .6-1.4A2 2 0 0 1 4 2h2v2H4v2H2Z" />
                </svg>
              </button>
            </div>
          </div>
          <div
            className="sdk-demo-overview"
            hidden={!overviewOpen}>
            <div className="sdk-demo-overview-bar">
              <label className="sdk-demo-overview-search">
                <svg
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5Zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" />
                </svg>
                <input
                  aria-label="Search tabs"
                  onChange={(event) => setTabQuery(event.target.value)}
                  placeholder="Search Tabs"
                  type="search"
                  value={tabQuery}
                />
              </label>
            </div>
            <div className="sdk-demo-overview-grid">
              <button
                aria-current={page === 'dashboard' ? 'page' : undefined}
                className="sdk-demo-tab-card"
                hidden={tabCardHidden('Warp HR SDK Scalar dashboard')}
                onClick={() => {
                  showPage('dashboard')
                  openOverview(false)
                }}
                type="button">
                <span className="sdk-demo-tab-card-head">
                  <span
                    aria-hidden="true"
                    className="sdk-demo-tab-card-mark">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M14.044 0c.243 0 .486.202.486.486v5.423l3.804-3.845c.202-.202.526-.202.688 0l2.914 2.914c.162.162.202.486 0 .648v.04L18.09 9.47h5.423c.284 0 .486.203.486.486v4.088a.468.468 0 0 1-.486.486h-5.423l3.845 3.804c.162.202.202.526 0 .688l-2.914 2.914c-.162.162-.486.202-.648 0h-.04L14.53 18.09v5.423a.468.468 0 0 1-.486.486H9.956a.468.468 0 0 1-.486-.486v-2.833c0-.89.365-1.74.972-2.388l5.261-5.261a1.466 1.466 0 0 0 0-2.064l-5.22-5.221A3.4 3.4 0 0 1 9.47 3.359V.486c0-.284.203-.486.486-.486h4.088Z" />
                    </svg>
                  </span>
                  Warp HR SDK
                </span>
                <span
                  aria-hidden="true"
                  className="sdk-demo-tab-card-preview">
                  <span className="sdk-demo-mini">
                    <span className="sdk-demo-mini-row">
                      <span className="sdk-demo-mini-title"></span>
                      <span className="sdk-demo-mini-button"></span>
                    </span>
                    <span className="sdk-demo-mini-card"></span>
                    <span className="sdk-demo-mini-grid">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                    <span className="sdk-demo-mini-panel">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </span>
                </span>
              </button>
              <button
                aria-current={page === 'video' ? 'page' : undefined}
                className="sdk-demo-tab-card"
                hidden={tabCardHidden('untitled')}
                onClick={() => {
                  showPage('video')
                  openOverview(false)
                }}
                type="button">
                <span className="sdk-demo-tab-card-head">
                  <span
                    aria-hidden="true"
                    className="sdk-demo-tab-card-mark sdk-demo-tab-card-mark-video">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
                    </svg>
                  </span>
                  Untitled
                </span>
                <span
                  aria-hidden="true"
                  className="sdk-demo-tab-card-preview sdk-demo-tab-card-preview-video">
                  <span className="sdk-demo-mini-play"></span>
                </span>
              </button>
              <button
                aria-current={page === 'site' ? 'page' : undefined}
                className="sdk-demo-tab-card"
                hidden={!siteRevealed || tabCardHidden('scalar.com Scalar')}
                onClick={() => {
                  showPage('site')
                  openOverview(false)
                }}
                type="button">
                <span className="sdk-demo-tab-card-head">
                  <span
                    aria-hidden="true"
                    className="sdk-demo-tab-card-mark">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M14.044 0c.243 0 .486.202.486.486v5.423l3.804-3.845c.202-.202.526-.202.688 0l2.914 2.914c.162.162.202.486 0 .648v.04L18.09 9.47h5.423c.284 0 .486.203.486.486v4.088a.468.468 0 0 1-.486.486h-5.423l3.845 3.804c.162.202.202.526 0 .688l-2.914 2.914c-.162.162-.486.202-.648 0h-.04L14.53 18.09v5.423a.468.468 0 0 1-.486.486H9.956a.468.468 0 0 1-.486-.486v-2.833c0-.89.365-1.74.972-2.388l5.261-5.261a1.466 1.466 0 0 0 0-2.064l-5.22-5.221A3.4 3.4 0 0 1 9.47 3.359V.486c0-.284.203-.486.486-.486h4.088Z" />
                    </svg>
                  </span>
                  Scalar
                </span>
                <span
                  aria-hidden="true"
                  className="sdk-demo-tab-card-preview sdk-demo-tab-card-preview-site">
                  <span className="sdk-demo-mini-site">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </span>
              </button>
              <button
                aria-label="New tab"
                className="sdk-demo-tab-card sdk-demo-tab-card-new"
                onClick={openSiteTab}
                type="button">
                +
              </button>
            </div>
          </div>
          <div className="sdk-demo-viewport">
            <div
              className="sdk-demo-main"
              hidden={page !== 'dashboard'}>
              <div className="sdk-demo-title-row">
                <div className="sdk-demo-title">Warp HR SDK</div>
                <div className="sdk-demo-title-actions">
                  <button
                    aria-expanded={apiOpen}
                    className="sdk-demo-ghost-button"
                    onClick={toggleApiWindow}
                    type="button">
                    {'{ } View API'}
                  </button>
                  <button
                    className="sdk-demo-build-button"
                    disabled={running}
                    onClick={runBuild}
                    type="button">
                    {running ? 'Building…' : 'Build'}
                  </button>
                </div>
              </div>
              <div className="sdk-demo-status">
                <div className="sdk-demo-status-left">
                  <span className={`sdk-demo-dot ${statusDotClass}`}></span>
                  <div className="sdk-demo-status-text">
                    <span className="sdk-demo-status-label">{statusLabel}</span>
                    <span className="sdk-demo-status-meta">
                      <code>v{version}</code>
                      <span>{running ? 'just now' : builtAt}</span>
                    </span>
                  </div>
                </div>
                <div className="sdk-demo-steps">
                  {steps.map(([name, done]) => (
                    <div
                      className="sdk-demo-step"
                      key={name}>
                      <span className="sdk-demo-step-name">{name}</span>
                      {done ? (
                        <span
                          aria-label={`${name} succeeded`}
                          className="sdk-demo-step-state sdk-demo-step-done">
                          ✓
                        </span>
                      ) : (
                        <span className="sdk-demo-step-state sdk-demo-spinner"></span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="sdk-demo-section-head">
                <span className="sdk-demo-section-title">Targets</span>
                <div className="sdk-demo-add-wrap">
                  <button
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                    className="sdk-demo-add"
                    onClick={() => setMenuOpen((open) => !open)}
                    type="button">
                    + Add target
                  </button>
                  <div
                    className="sdk-demo-add-menu"
                    role="menu">
                    {available.length === 0 ? (
                      <span className="sdk-demo-add-empty">Every demo target is added</span>
                    ) : (
                      available.map((key) => (
                        <button
                          className="sdk-demo-add-item"
                          key={key}
                          onClick={() => {
                            setInstalled((current) => (current.includes(key) ? current : [...current, key]))
                            setSelected(key)
                            setMenuOpen(false)
                          }}
                          type="button">
                          <span className="sdk-demo-add-item-name">{TARGETS[key].label}</span>
                          <span className="sdk-demo-add-item-meta">{TARGETS[key].registry}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="sdk-demo-targets">
                {installed.map((key) => (
                  <button
                    aria-pressed={key === selected}
                    className="sdk-demo-target"
                    key={key}
                    onClick={() => {
                      setSelected(key)
                      setMenuOpen(false)
                    }}
                    type="button">
                    {/* The logo markup is ours, straight from the dashboard's icon assets. */}
                    <span
                      className="sdk-demo-target-mark"
                      dangerouslySetInnerHTML={{ __html: TARGETS[key].logo }}
                    />
                    {/* Name and the experimental badge share a row so the registry line
                        below keeps the full width of the card. */}
                    <span className="sdk-demo-target-body">
                      <span className="sdk-demo-target-head">
                        <span className="sdk-demo-target-name">{TARGETS[key].label}</span>
                        {!TARGETS[key].stable && <span className="sdk-demo-badge">Experimental</span>}
                      </span>
                      <span className="sdk-demo-target-registry">{TARGETS[key].registry}</span>
                    </span>
                    <span
                      aria-label="Generated"
                      className="sdk-demo-dot sdk-demo-dot-green"></span>
                  </button>
                ))}
              </div>
              <div className="sdk-demo-package">
                <span className="sdk-demo-package-title">
                  <span className="sdk-demo-package-name">{config.packageName}</span>
                  <span
                    aria-hidden="true"
                    className="sdk-demo-package-sep">
                    ·
                  </span>
                  <span className="sdk-demo-package-registry">{config.registry}</span>
                </span>
                <span className="sdk-demo-install">{config.install}</span>
              </div>
              <div className="sdk-demo-panel">
                <div
                  aria-label="Generated output"
                  className="sdk-demo-tabs"
                  onKeyDown={onTablistKeyDown}
                  role="tablist">
                  {PANEL_TABS.map(([key, label]) => (
                    <button
                      aria-selected={key === tab}
                      className="sdk-demo-tab"
                      key={key}
                      onClick={() => setTab(key)}
                      ref={(node) => {
                        tabRefs.current[key] = node
                      }}
                      role="tab"
                      tabIndex={key === tab ? 0 : -1}
                      type="button">
                      {label}
                    </button>
                  ))}
                </div>
                <div className="sdk-demo-code-head">
                  <span>{codeTitle}</span>
                </div>
                <pre
                  className="sdk-demo-code"
                  hidden={showFiles}>
                  {codeBody}
                </pre>
                <div
                  className="sdk-demo-files"
                  hidden={!showFiles}>
                  {config.files.map((file) => (
                    <div
                      className={`sdk-demo-file${file.kind === 'dir' ? ' sdk-demo-file-dir' : ''}`}
                      data-depth={String(file.depth ?? 0)}
                      key={file.path}>
                      <span className="sdk-demo-file-path">{file.path}</span>
                      {file.badge && <span className="sdk-demo-file-badge">{file.badge}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div
              className="sdk-demo-video"
              hidden={page !== 'video'}>
              <div className="sdk-demo-video-frame">
                <iframe
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={videoLoaded ? VIDEO_EMBED : undefined}
                  title="Rick Astley - Never Gonna Give You Up"
                />
              </div>
              <p className="sdk-demo-video-caption">Rick Astley — Never Gonna Give You Up</p>
            </div>
            <div
              className="sdk-demo-site"
              hidden={page !== 'site'}>
              <iframe
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-popups"
                src={siteLoaded ? SITE_EMBED : undefined}
                title="scalar.com"
              />
            </div>
          </div>
        </div>
        {/* The hint never takes pointer events, so the click that dismisses it
            is also the click that does what the reader meant to do. */}
        <div
          className="sdk-demo-hint"
          hidden={!hintVisible}>
          <span className="sdk-demo-hint-pill">
            <span
              aria-hidden="true"
              className="sdk-demo-hint-dot"></span>
            Click to interact
          </span>
        </div>
        <div
          className="sdk-demo-window sdk-demo-window-build"
          hidden={!buildOpen}
          ref={buildWindowRef}>
          <div
            className="sdk-demo-window-bar"
            ref={buildBarRef}>
            <div className="sdk-demo-window-lights">
              <button
                aria-label="Close the build log"
                onClick={() => setBuildOpen(false)}
                type="button"></button>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </div>
          </div>
          <div
            aria-label="Build log"
            className="sdk-demo-log"
            ref={logRef}
            role="log">
            {BUILD_LOG.slice(0, logIndex).map(([line], index) => (
              <div
                className={`sdk-demo-log-line${
                  /* The newest line is the one still running, until the next one lands. */
                  index === logIndex - 1 && running ? ' sdk-demo-log-active' : ''
                }`}
                key={line}>
                <span className="sdk-demo-log-prompt">$</span>
                <span className="sdk-demo-log-text">{line}</span>
              </div>
            ))}
            {running && <div className="sdk-demo-log-cursor"></div>}
          </div>
        </div>
        <div
          className="sdk-demo-window sdk-demo-window-api"
          hidden={!apiOpen}
          ref={apiWindowRef}>
          <div
            className="sdk-demo-window-bar"
            ref={apiBarRef}>
            <div className="sdk-demo-window-lights">
              <button
                aria-label="Close the API document"
                onClick={() => setApiOpen(false)}
                type="button"></button>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </div>
            <span className="sdk-demo-window-title">openapi.yaml</span>
          </div>
          <pre className="sdk-demo-api-doc">{apiDoc}</pre>
        </div>
        <div
          className="sdk-demo-share-layer"
          hidden={!shareOpen}>
          <div
            className="sdk-demo-share-scrim"
            onClick={() => openShare(false)}></div>
          <div
            aria-label="Share"
            aria-modal="true"
            className="sdk-demo-share-sheet"
            role="dialog">
            <span
              aria-hidden="true"
              className="sdk-demo-share-grabber"></span>
            <div className="sdk-demo-share-card sdk-demo-share-preview">
              <span
                aria-hidden="true"
                className="sdk-demo-share-favicon">
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M14.044 0c.243 0 .486.202.486.486v5.423l3.804-3.845c.202-.202.526-.202.688 0l2.914 2.914c.162.162.202.486 0 .648v.04L18.09 9.47h5.423c.284 0 .486.203.486.486v4.088a.468.468 0 0 1-.486.486h-5.423l3.845 3.804c.162.202.202.526 0 .688l-2.914 2.914c-.162.162-.486.202-.648 0h-.04L14.53 18.09v5.423a.468.468 0 0 1-.486.486H9.956a.468.468 0 0 1-.486-.486v-2.833c0-.89.365-1.74.972-2.388l5.261-5.261a1.466 1.466 0 0 0 0-2.064l-5.22-5.221A3.4 3.4 0 0 1 9.47 3.359V.486c0-.284.203-.486.486-.486h4.088Z" />
                </svg>
              </span>
              <span className="sdk-demo-share-preview-text">
                <span className="sdk-demo-share-preview-title">{SHARE_TITLE}</span>
                <span className="sdk-demo-share-preview-host">{SHARE_HOST}</span>
              </span>
              <span className="sdk-demo-share-options">
                Options <span aria-hidden="true">›</span>
              </span>
            </div>
            <div className="sdk-demo-share-people">
              <a
                className="sdk-demo-share-person"
                href={SMS_HREF}
                onClick={() => handleLinkShare('Messages')}>
                <span
                  aria-hidden="true"
                  className="sdk-demo-share-avatar">
                  M<span className="sdk-demo-share-avatar-badge"></span>
                </span>
                <span className="sdk-demo-share-person-name">Marc</span>
              </a>
            </div>
            <div className="sdk-demo-share-apps">
              <a
                className="sdk-demo-share-app"
                href={SMS_HREF}
                onClick={() => handleLinkShare('Messages')}>
                <span
                  aria-hidden="true"
                  className="sdk-demo-share-tile sdk-demo-share-tile-messages">
                  <svg
                    fill="#fff"
                    viewBox="0 0 24 24">
                    <path d="M12 3C6.9 3 2.8 6.4 2.8 10.6c0 2.4 1.3 4.5 3.4 5.9-.2 1.2-.8 2.4-1.7 3.3 1.6-.2 3.1-.8 4.4-1.7 1 .3 2 .4 3.1.4 5.1 0 9.2-3.4 9.2-7.6S17.1 3 12 3Z" />
                  </svg>
                </span>
                <span className="sdk-demo-share-app-name">Messages</span>
              </a>
              <a
                className="sdk-demo-share-app"
                href={MAILTO_HREF}
                onClick={() => handleLinkShare('Mail')}>
                <span
                  aria-hidden="true"
                  className="sdk-demo-share-tile sdk-demo-share-tile-mail">
                  <svg
                    fill="none"
                    stroke="#fff"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24">
                    <rect
                      height="13"
                      rx="2.5"
                      width="18"
                      x="3"
                      y="5.5"
                    />
                    <path d="m3.8 7.5 7.1 5.2c.7.5 1.6.5 2.2 0l7.1-5.2" />
                  </svg>
                </span>
                <span className="sdk-demo-share-app-name">Mail</span>
              </a>
              <button
                className="sdk-demo-share-app"
                onClick={() => handlePasteShare('Slack')}
                type="button">
                <span
                  aria-hidden="true"
                  className="sdk-demo-share-tile sdk-demo-share-tile-slack">
                  <svg viewBox="0 0 24 24">
                    <rect
                      fill="#36c5f0"
                      height="9.2"
                      rx="1.7"
                      width="3.4"
                      x="8.6"
                      y="1.8"
                    />
                    <rect
                      fill="#2eb67d"
                      height="3.4"
                      rx="1.7"
                      width="9.2"
                      x="13"
                      y="8.6"
                    />
                    <rect
                      fill="#e01e5a"
                      height="9.2"
                      rx="1.7"
                      width="3.4"
                      x="12"
                      y="13"
                    />
                    <rect
                      fill="#ecb22e"
                      height="3.4"
                      rx="1.7"
                      width="9.2"
                      x="1.8"
                      y="12"
                    />
                  </svg>
                </span>
                <span className="sdk-demo-share-app-name">Slack</span>
              </button>
              <button
                className="sdk-demo-share-app"
                onClick={() => handlePasteShare('Notes')}
                type="button">
                <span
                  aria-hidden="true"
                  className="sdk-demo-share-tile sdk-demo-share-tile-notes">
                  <svg
                    stroke="#8a6d1f"
                    strokeLinecap="round"
                    strokeWidth="1.6"
                    viewBox="0 0 24 24">
                    <path d="M7 9h10M7 13h10M7 17h6" />
                  </svg>
                </span>
                <span className="sdk-demo-share-app-name">Notes</span>
              </button>
              <span className="sdk-demo-share-app sdk-demo-share-app-inert">
                <span
                  aria-hidden="true"
                  className="sdk-demo-share-tile sdk-demo-share-tile-more">
                  <svg
                    fill="currentColor"
                    viewBox="0 0 24 24">
                    <circle
                      cx="6"
                      cy="12"
                      r="1.8"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="1.8"
                    />
                    <circle
                      cx="18"
                      cy="12"
                      r="1.8"
                    />
                  </svg>
                </span>
                <span className="sdk-demo-share-app-name">More</span>
              </span>
            </div>
            <p
              className="sdk-demo-share-status"
              role="status">
              {shareStatus}
            </p>
            <div className="sdk-demo-share-card sdk-demo-share-actions">
              <button
                className="sdk-demo-share-action"
                onClick={handleCopy}
                type="button">
                <span>{copyLabel}</span>
                <svg
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M9 18a2 2 0 0 1-2-2V4c0-.6.2-1 .6-1.4A2 2 0 0 1 9 2h9c.6 0 1 .2 1.4.6.4.4.6.8.6 1.4v12c0 .6-.2 1-.6 1.4a2 2 0 0 1-1.4.6H9Zm0-2h9V4H9v12Zm-4 6a2 2 0 0 1-1.4-.6A2 2 0 0 1 3 20V6h2v14h11v2H5Z" />
                </svg>
              </button>
              <button
                className="sdk-demo-share-action"
                type="button">
                <span>Add to Reading List</span>
                <svg
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M4 21V5c0-.6.2-1 .6-1.4A2 2 0 0 1 6 3h12c.6 0 1 .2 1.4.6.4.4.6.8.6 1.4v16l-8-3.4L4 21Z" />
                </svg>
              </button>
              <button
                className="sdk-demo-share-action"
                type="button">
                <span>Find on Page</span>
                <svg
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5Zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" />
                </svg>
              </button>
            </div>
            <button
              className="sdk-demo-share-cancel"
              onClick={() => openShare(false)}
              type="button">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
