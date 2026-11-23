/**
 * A one-time invitation to the API Hosting beta across scalar.com, as the API client and the localhost API reference
 * invite their users: the reference's Deploy card in a popup, with the waitlist form from /products/api-hosting inside
 * it. api-hosting-waitlist.js sends that form, so a sign-up here lands in the same Loops list and user group, marked
 * `landing` as the hosting page marks its own.
 *
 * It can open on any page but the home page, which stays as it is, and the hosting page, which has the same form in
 * its hero. Someone reading should not have a popup land on top of the page, so it only opens on the page a visit
 * starts on, once it has loaded and sat for a moment with nobody pressing a key, clicking, scrolling, dragging or
 * going back, with the tab in view and no other popup up. If they have started by then, it leaves them to it. It opens
 * at most once in a browser, and never after a sign-up from the hosting page. It stays away from phones and touch
 * screens, where a popup over the page someone just opened is in the way (and search engines count it against the
 * page), and from automated browsers.
 */
;(() => {
  if (document.documentElement.dataset.hostingInvite === 'started') {
    return
  }
  document.documentElement.dataset.hostingInvite = 'started'

  /** The same name the API reference uses for its invitation. api-hosting-waitlist.js sets it after a sign-up. */
  const SEEN_KEY = 'scalar-api-hosting-beta-prompt-seen'

  /** How long the page has to sit untouched once it has loaded, the same wait the API client gives it. */
  const OPEN_DELAY_MS = 1500

  /** The longest the popup waits for the page to be idle after that, so it never opens in the middle of heavy work */
  const IDLE_TIMEOUT_MS = 2000

  /** Keys that do nothing on their own, such as Command on the way to switching apps */
  const MODIFIER_KEYS = new Set(['Alt', 'AltGraph', 'CapsLock', 'Control', 'Fn', 'Meta', 'Shift'])

  const FRAMEWORKS = [
    '.NET',
    'AdonisJS',
    'Elysia',
    'Express',
    'FastAPI',
    'Fastify',
    'Go',
    'Hono',
    'Laravel',
    'Litestar',
    'NestJS',
    'Next.js',
    'Nitro',
    'Nuxt',
    'Platformatic',
    'Rust',
    'Other',
  ]

  /* Phosphor's regular weight, as the reference's card draws them */
  const ICONS = {
    butterfly:
      'M232.7,50.48C229,45.7,221.84,40,209,40c-16.85,0-38.46,11.28-57.81,30.16A140.07,140.07,0,0,0,136,87.53V56a8,8,0,0,0-16,0V87.53a140.07,140.07,0,0,0-15.15-17.37C85.49,51.28,63.88,40,47,40,34.16,40,27,45.7,23.3,50.48c-6.82,8.77-12.18,24.08-.21,71.2,6.05,23.83,19.51,33,30.63,36.42A44,44,0,0,0,128,205.27a44,44,0,0,0,74.28-47.17c11.12-3.4,24.57-12.59,30.63-36.42C239.63,95.24,244.85,66.1,232.7,50.48ZM92,208A28.12,28.12,0,0,1,88.86,152a8,8,0,1,0-1.76-15.9A43.64,43.64,0,0,0,66.36,144c-8.43.09-22-3.57-27.76-26.26C35.72,106.39,27,71.86,35.94,60.3,37.37,58.46,40.09,56,47,56c27.27,0,73,44.88,73,71.67V180A28,28,0,0,1,92,208ZM217.4,117.74c-5.77,22.69-19.33,26.34-27.77,26.26a43.6,43.6,0,0,0-20.74-7.95,8,8,0,1,0-1.76,15.9A28.11,28.11,0,1,1,136,180V127.67C136,100.88,181.69,56,209,56c6.95,0,9.66,2.46,11.1,4.3C229.05,71.86,220.28,106.39,217.4,117.74Z',
    x: 'M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z',
    caretDown:
      'M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z',
    cpu: 'M152,96H104a8,8,0,0,0-8,8v48a8,8,0,0,0,8,8h48a8,8,0,0,0,8-8V104A8,8,0,0,0,152,96Zm-8,48H112V112h32Zm88,0H216V112h16a8,8,0,0,0,0-16H216V56a16,16,0,0,0-16-16H160V24a8,8,0,0,0-16,0V40H112V24a8,8,0,0,0-16,0V40H56A16,16,0,0,0,40,56V96H24a8,8,0,0,0,0,16H40v32H24a8,8,0,0,0,0,16H40v40a16,16,0,0,0,16,16H96v16a8,8,0,0,0,16,0V216h32v16a8,8,0,0,0,16,0V216h40a16,16,0,0,0,16-16V160h16a8,8,0,0,0,0-16Zm-32,56H56V56H200v95.87s0,.09,0,.13,0,.09,0,.13V200Z',
    moon: 'M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z',
    gitBranch:
      'M232,64a32,32,0,1,0-40,31v17a8,8,0,0,1-8,8H96a23.84,23.84,0,0,0-8,1.38V95a32,32,0,1,0-16,0v66a32,32,0,1,0,16,0V144a8,8,0,0,1,8-8h88a24,24,0,0,0,24-24V95A32.06,32.06,0,0,0,232,64ZM64,64A16,16,0,1,1,80,80,16,16,0,0,1,64,64ZM96,192a16,16,0,1,1-16-16A16,16,0,0,1,96,192ZM200,80a16,16,0,1,1,16-16A16,16,0,0,1,200,80Z',
  }
  const icon = (name, className) =>
    `<svg class="${className}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false"><path d="${ICONS[name]}"></path></svg>`

  const FEATURES = [
    ['cpu', 'Scales with your traffic', 'From 1 vCPU · 0.5 GB up to 48 vCPU · 48 GB.'],
    ['moon', 'Sleeps when idle, $0', 'Billed per second for what runs. No request fees.'],
    [
      'gitBranch',
      'Deploys on every push',
      'Previews for pull requests, logs and metrics, and private networking to your other services.',
    ],
  ]

  /** Pages the popup leaves alone: the home page, and the hosting page with its own sign-up in the hero */
  const PAGES_WITHOUT_POPUP = new Set(['/', '/products/api-hosting'])
  const isPageWithoutPopup = () => PAGES_WITHOUT_POPUP.has(location.pathname.replace(/(.)\/+$/, '$1'))

  /* A browser that cannot keep the answer would show the popup on every visit, so that counts as seen too. */
  const hasSeen = () => {
    try {
      return localStorage.getItem(SEEN_KEY) === 'true'
    } catch {
      return true
    }
  }
  const remember = () => {
    try {
      localStorage.setItem(SEEN_KEY, 'true')
    } catch {
      // It was readable a moment ago; nothing more to do if it is not writable
    }
  }

  /* Laid out and not hidden: the cookie banner keeps its closed settings dialog on the page with `visibility: hidden` */
  const isVisible = (element) => {
    if (!(element instanceof HTMLElement)) {
      return false
    }
    if (typeof element.checkVisibility === 'function') {
      return element.checkVisibility({ visibilityProperty: true, opacityProperty: true })
    }
    return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden'
  }

  /* Another popup is up, such as search, or the cookie banner, which must stay reachable rather than sit under this
     one. */
  const hasOtherPopup = () =>
    Array.from(document.querySelectorAll('dialog[open], [role="dialog"], [aria-modal="true"]')).some(isVisible) ||
    Array.from(document.querySelectorAll('.cky-consent-container:not(.cky-hide), .cky-modal.cky-modal-open')).some(
      isVisible,
    )

  const desktop = matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)')

  if (
    isPageWithoutPopup() ||
    navigator.webdriver === true ||
    !desktop.matches ||
    typeof HTMLDialogElement !== 'function' ||
    hasSeen()
  ) {
    return
  }

  let openTimer
  let idleHandle

  const cancelWait = () => {
    clearTimeout(openTimer)
    openTimer = undefined
    if (idleHandle !== undefined && typeof cancelIdleCallback === 'function') {
      cancelIdleCallback(idleHandle)
    }
    idleHandle = undefined
  }

  /** Someone has started reading, so this visit is theirs. */
  const giveUp = () => {
    cancelWait()
    window.removeEventListener('keydown', handleKeydown, true)
    window.removeEventListener('pointerdown', giveUp, true)
    window.removeEventListener('wheel', giveUp, true)
    window.removeEventListener('scroll', giveUp, true)
    window.removeEventListener('dragenter', giveUp, true)
    window.removeEventListener('popstate', giveUp)
    window.removeEventListener('load', restartWait)
    document.removeEventListener('visibilitychange', restartWait)
  }

  function handleKeydown(event) {
    if (!MODIFIER_KEYS.has(event.key)) {
      giveUp()
    }
  }

  /* Starts the wait over once the page has loaded and while it is in view, and pauses it while it is not. After the
     wait, the popup opens when the browser is next idle, so the heroes have finished their own start-up work and the
     email field answers at once. */
  function restartWait() {
    cancelWait()
    if (document.readyState !== 'complete' || document.visibilityState === 'hidden') {
      return
    }
    openTimer = setTimeout(() => {
      openTimer = undefined
      if (typeof requestIdleCallback === 'function') {
        idleHandle = requestIdleCallback(open, { timeout: IDLE_TIMEOUT_MS })
      } else {
        open()
      }
    }, OPEN_DELAY_MS)
  }

  /* The site's hotkeys listen on the window and would act on the page under the popup, such as Cmd+K opening search
     beneath it. They take Ctrl, Command or Option, so those stop at the popup; Escape and Tab carry on. */
  const keepHotkeysInside = (event) => {
    if ((event.ctrlKey || event.metaKey || event.altKey) && event.key !== 'Escape' && event.key !== 'Tab') {
      event.stopPropagation()
    }
  }

  const build = () => {
    const dialog = document.createElement('dialog')
    dialog.className = 'hosting-invite'
    dialog.setAttribute('aria-labelledby', 'hosting-invite-title')
    dialog.innerHTML = `
      <div class="hosting-invite-card">
        <span class="hosting-invite-wash" aria-hidden="true"></span>
        ${icon('butterfly', 'hosting-invite-butterfly')}
        <h2 class="hosting-invite-title" id="hosting-invite-title">Deploy your API on Scalar</h2>
        <p class="hosting-invite-description" id="hosting-invite-description">Run it on Scalar. $5 of free credits, no card.</p>
        <form class="hosting-invite-form" data-bf-waitlist action="https://app.loops.so/api/newsletter-form/clksm7aj203tclb0olg1z2xb3" method="post">
          <input type="hidden" name="userGroup" value="Hosting" />
          <input type="hidden" name="mailingLists" value="" />
          <input type="hidden" name="landing" value="true" />
          <div class="hosting-invite-row">
            <div class="hosting-invite-combo">
              <label class="hosting-invite-sr" for="hosting-invite-email">Email</label>
              <input id="hosting-invite-email" class="hosting-invite-email" name="email" type="email" required autocomplete="email" placeholder="you@example.com" aria-describedby="hosting-invite-description" />
              <label class="hosting-invite-sr" for="hosting-invite-framework">Framework</label>
              <span class="hosting-invite-select">
                <select id="hosting-invite-framework" name="framework">
                  <option value="">Framework</option>
                  ${FRAMEWORKS.map((name) => `<option>${name}</option>`).join('')}
                </select>
                ${icon('caretDown', 'hosting-invite-caret')}
              </span>
            </div>
            <button type="submit" class="hosting-invite-join">Join Waitlist</button>
          </div>
        </form>
        <button type="button" class="hosting-invite-done" data-hosting-invite-close hidden>Done</button>
        <ul class="hosting-invite-features" role="list">
          ${FEATURES.map(
            ([name, title, description]) => `
            <li>
              ${icon(name, 'hosting-invite-feature-icon')}
              <span><strong>${title}</strong><span>${description}</span></span>
            </li>`,
          ).join('')}
        </ul>
        <p class="hosting-invite-plans">Then $1/mo on Free · Hobby $5/mo with $5 of usage included · Pro $20/mo · <a href="/pricing" data-hosting-invite-close>See plans</a></p>
        <button type="button" class="hosting-invite-close" data-hosting-invite-close aria-label="Close">${icon('x', 'hosting-invite-close-icon')}</button>
      </div>`

    const form = dialog.querySelector('form')
    const done = dialog.querySelector('.hosting-invite-done')

    /* After a sign-up the thanks takes the form's place, and the button that had focus goes with it, so focus moves
       to Done rather than dropping out of the popup. The form's live region reads the thanks out. */
    const watchSignUp = new MutationObserver(() => {
      if (form?.classList.contains('is-done') && done instanceof HTMLElement && done.hidden) {
        done.hidden = false
        done.focus()
      }
    })
    if (form) {
      watchSignUp.observe(form, { attributes: true, attributeFilter: ['class'] })
    }

    /* Close and Done, and See plans, which the site opens in place under the popup unless the popup goes first. The
       click still reaches the site's router after this. */
    for (const control of dialog.querySelectorAll('[data-hosting-invite-close]')) {
      control.addEventListener('click', () => dialog.close())
    }

    /* A click on the backdrop closes the popup. The press and the release both have to land there, so a selection
       dragged across the card's edge, either way, does not. The card fills the dialog, so its box is the backdrop. */
    let pressedOutside = false
    let releasedOutside = false
    dialog.addEventListener('pointerdown', (event) => {
      pressedOutside = event.target === dialog
    })
    dialog.addEventListener('pointerup', (event) => {
      releasedOutside = event.target === dialog
    })
    dialog.addEventListener('click', (event) => {
      if (pressedOutside && releasedOutside && event.target === dialog) {
        dialog.close()
      }
      pressedOutside = false
      releasedOutside = false
    })

    dialog.addEventListener('keydown', keepHotkeysInside)

    // Back and forward change the page under the popup, so the popup goes with the page it opened on
    const closeOnHistory = () => dialog.close()
    window.addEventListener('popstate', closeOnHistory)

    dialog.addEventListener('close', () => {
      window.removeEventListener('popstate', closeOnHistory)
      watchSignUp.disconnect()
      document.documentElement.classList.remove('hosting-invite-open')
      dialog.remove()
    })

    return dialog
  }

  function open(deadline) {
    idleHandle = undefined
    giveUp()
    // A timed-out callback can run while startup work is still keeping the browser busy.
    if (
      deadline?.didTimeout ||
      !desktop.matches ||
      isPageWithoutPopup() ||
      document.visibilityState === 'hidden' ||
      hasSeen() ||
      hasOtherPopup()
    ) {
      return
    }
    remember()

    const dialog = build()
    document.body.append(dialog)
    document.documentElement.classList.add('hosting-invite-open')
    dialog.showModal()
    // Signing up is all the popup is for, and it only opened because nobody had touched the page
    dialog.querySelector('input[type="email"]')?.focus()
  }

  // Captured, so a control that stops its own events still counts as someone starting
  window.addEventListener('keydown', handleKeydown, true)
  window.addEventListener('pointerdown', giveUp, true)
  window.addEventListener('wheel', giveUp, { capture: true, passive: true })
  // A screen reader moving through the page, or a jump to an anchor, scrolls it without a key or wheel event
  window.addEventListener('scroll', giveUp, { capture: true, passive: true })
  window.addEventListener('dragenter', giveUp, true)
  window.addEventListener('popstate', giveUp)
  window.addEventListener('load', restartWait)
  document.addEventListener('visibilitychange', restartWait)
  restartWait()
})()
