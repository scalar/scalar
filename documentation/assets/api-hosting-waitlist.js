/**
 * The hosting waitlist on /products/api-hosting: an email and the framework it would run on, sent to the Loops form
 * behind the Deploy card in the API reference's developer tools. It uses the same `Hosting` user group, the same
 * messages and the same one-minute local rate limit as the card, so a sign-up in either place behaves alike, and Loops
 * keeps `framework` as a contact property of that name, as it does for the card.
 *
 * The page is rendered on the server and hydration then replaces it, so the form is never bound to directly: listeners
 * on the document catch its events, whichever copy of the form is on the page.
 */
;(() => {
  // Not `bfWaitlist`: on <html> that would become data-bf-waitlist and match the form's own selector
  if (document.documentElement.dataset.bfWaitlistListening === 'true') {
    return
  }
  document.documentElement.dataset.bfWaitlistListening = 'true'

  const FORM = 'form[data-bf-waitlist]'

  /* Shared with the Deploy card and the Loops embed, so a sign-up in any of them counts towards the same limit. */
  const RATE_LIMIT_KEY = 'loops-form-timestamp'
  const RATE_LIMIT_MS = 60_000

  const MESSAGES = {
    success: "Thanks! We'll be in touch!",
    error: 'Oops! Something went wrong, please try again',
    rateLimit: 'Too many signups, please try again in a little while',
  }

  /* Private windows can refuse storage, which only means the local rate limit does not apply. */
  const readTimestamp = () => {
    try {
      return Number(localStorage.getItem(RATE_LIMIT_KEY)) || 0
    } catch {
      return 0
    }
  }
  const writeTimestamp = (value) => {
    try {
      localStorage.setItem(RATE_LIMIT_KEY, value)
    } catch {
      // Nothing to remember then
    }
  }

  /* The page leaves out an empty paragraph, so the line that says how a sign-up went is made here. It is made when
     the form is first used, so that a screen reader already knows it is a live region when something is said in it. */
  const LIVE_AFTER_MS = 100
  const lines = new WeakMap()
  const statusOf = (form) => {
    const found = form.querySelector('[data-bf-waitlist-status]')
    if (found instanceof HTMLElement) {
      return found
    }
    const status = document.createElement('p')
    status.className = 'bf-waitlist-status'
    status.id = 'bf-waitlist-status'
    status.dataset.bfWaitlistStatus = ''
    status.setAttribute('aria-live', 'polite')
    form.append(status)
    lines.set(status, { madeAt: Date.now(), timer: undefined })
    return status
  }

  const say = (form, message, isError) => {
    const status = statusOf(form)
    const email = form.querySelector('input[name="email"]')
    const write = () => {
      status.textContent = message
      status.classList.toggle('is-error', Boolean(isError))
    }
    // A live region that has only just been made is not listened to yet, so its words wait a moment. Only the
    // latest words are kept, so a thanks never gets cleared by the blank line written just before it.
    const line = lines.get(status)
    if (line) {
      clearTimeout(line.timer)
      const wait = line.madeAt + LIVE_AFTER_MS - Date.now()
      if (wait > 0) {
        line.timer = setTimeout(write, wait)
      } else {
        write()
      }
    } else {
      write()
    }
    // An error reads out with the field it is about, the next time the field is focused
    if (email instanceof HTMLElement) {
      if (isError) {
        email.setAttribute('aria-describedby', status.id)
      } else {
        email.removeAttribute('aria-describedby')
      }
    }
  }

  /* The framework is only as wide as what it says. CSS does that with field-sizing where it can; elsewhere the
     dropdown is measured here, or it would be as wide as its longest option. */
  const sizesItself = typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content')
  const fitSelect = (select) => {
    if (sizesItself || !(select instanceof HTMLSelectElement)) {
      return
    }
    const style = getComputedStyle(select)
    const context = document.createElement('canvas').getContext('2d')
    if (!context) {
      return
    }
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    const text = select.selectedOptions[0]?.textContent ?? ''
    const width =
      context.measureText(text).width + Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
    select.style.width = `${Math.ceil(width)}px`
  }
  const fitAll = () => {
    for (const select of document.querySelectorAll(`${FORM} select`)) {
      fitSelect(select)
    }
  }

  const submit = async (form) => {
    if (form.dataset.bfBusy === 'true') {
      return
    }

    const now = Date.now()
    if (readTimestamp() + RATE_LIMIT_MS > now) {
      say(form, MESSAGES.rateLimit, true)
      return
    }
    writeTimestamp(String(now))

    const button = form.querySelector('button[type="submit"]')
    form.dataset.bfBusy = 'true'
    button?.setAttribute('aria-busy', 'true')
    say(form, '', false)

    const body = new URLSearchParams()
    for (const [key, value] of new FormData(form)) {
      // A framework nobody picked is left out, as the Deploy card leaves it out when it does not know one
      if (typeof value === 'string' && !(key === 'framework' && value === '')) {
        body.append(key, value)
      }
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => undefined)
        const message = data && typeof data === 'object' && 'message' in data ? String(data.message) : ''
        say(form, message || response.statusText || MESSAGES.error, true)
        return
      }

      form.reset()
      form.classList.add('is-done')
      say(form, MESSAGES.success, false)
    } catch (error) {
      // Loops sits behind Cloudflare, which answers too many sign-ups with a blocked request
      if (error instanceof TypeError && /Failed to fetch|Load failed|NetworkError/.test(error.message)) {
        say(form, MESSAGES.rateLimit, true)
        return
      }
      writeTimestamp('')
      say(form, MESSAGES.error, true)
    } finally {
      form.dataset.bfBusy = 'false'
      button?.removeAttribute('aria-busy')
    }
  }

  document.addEventListener(
    'submit',
    (event) => {
      const form = event.target
      if (!(form instanceof HTMLFormElement) || !form.matches(FORM)) {
        return
      }
      event.preventDefault()
      void submit(form)
    },
    true,
  )

  document.addEventListener('focusin', (event) => {
    const form = event.target instanceof Element ? event.target.closest(FORM) : null
    if (form instanceof HTMLFormElement) {
      statusOf(form)
    }
  })

  // Typing again after an error takes the error away
  document.addEventListener('input', (event) => {
    const form = event.target instanceof Element ? event.target.closest(FORM) : null
    const status = form?.querySelector('[data-bf-waitlist-status]')
    if (form instanceof HTMLFormElement && status?.classList.contains('is-error')) {
      say(form, '', false)
    }
  })

  document.addEventListener('change', (event) => {
    if (event.target instanceof HTMLSelectElement && event.target.closest(FORM)) {
      fitSelect(event.target)
    }
  })

  if (!sizesItself) {
    fitAll()
    window.addEventListener('load', fitAll)
  }
})()
