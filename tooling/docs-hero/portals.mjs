/* Both faces of each portal, baked together so they can never drift apart.
 *
 *   left of the seam   the browser rendering the API reference
 *   right of it        the same browser on the same page's .md — plain
 *                      monospace text, markdown syntax and all, the way a
 *                      browser shows a file it has no renderer for
 *
 * The row draws one on top of the other and the seam cuts both, so the
 * window, its chrome and its address bar stay put and only the page inside
 * changes as the seam moves. That is why one generator makes all eight
 * files and why the address differs only by the `.md` on the end.
 *
 * Both windows wear the same chrome: Clerk's frosted glass, which is a
 * translucent shell with the page floating inside it. As drawn it was
 * white at 4–14% over whatever was behind, so it disappeared on a white
 * page and looked the same in the dark; here it is tinted the other way
 * for the light mode and the page is given a gutter all round, so the
 * shell cuts it cleanly instead of letting it run past the bottom edge.
 *
 *   node tooling/docs-hero/portals.mjs [--write]
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/* the repository's own Playwright, which re-exports the browsers */
import { chromium } from '@playwright/test'

import { parts } from './extract.mjs'
import { supabase } from './supabase.mjs'

const W = 1360
const H = 765
/* both found from this file, so the bake is the same wherever it is run
   from: OUT is what the hero loads, PREVIEW is where a run without
   --write leaves its faces to be looked at */
const OUT = fileURLToPath(new URL('../../documentation/assets/docs-hero', import.meta.url))
const PREVIEW = fileURLToPath(new URL('./out', import.meta.url))
const QUALITY = 0.86

/* The page the portal is standing on, in each mode, read off scalar.com.
   The glass is translucent, so what is behind it decides its colour: bake
   each mode over the page it will actually sit on. */
const PAPER = { light: '#fff', dark: '#0f0f0f' }

const GLASS = {
  light: {
    shell: 'rgba(0, 0, 0, 0.05)',
    ring: 'rgba(0, 0, 0, 0.09)',
    bar: 'rgba(0, 0, 0, 0.025)',
    lights: 'rgba(0, 0, 0, 0.16)',
    icon: 'rgba(0, 0, 0, 0.42)',
    pill: 'rgba(255, 255, 255, 0.8)',
    pillRing: 'rgba(0, 0, 0, 0.07)',
    ink: 'rgba(0, 0, 0, 0.7)',
    lift: '0 1px 2px rgba(0, 0, 0, 0.06), 0 10px 28px rgba(0, 0, 0, 0.08)',
  },
  dark: {
    shell: 'rgba(255, 255, 255, 0.08)',
    ring: 'rgba(255, 255, 255, 0.18)',
    bar: 'rgba(255, 255, 255, 0.04)',
    lights: 'rgba(255, 255, 255, 0.45)',
    icon: 'rgba(255, 255, 255, 0.75)',
    pill: 'rgba(255, 255, 255, 0.14)',
    pillRing: 'rgba(255, 255, 255, 0.18)',
    ink: 'rgba(255, 255, 255, 0.9)',
    lift: '0 1px 2px rgba(0, 0, 0, 0.4), 0 10px 28px rgba(0, 0, 0, 0.45)',
  },
}

const frame = (mode) => `
  html, body { margin: 0; padding: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: ${PAPER[mode]}; }
  .transform-rr { transform: none !important; }
  .h-animation-ref, .ck-page, .ck-page.rr, .sb-shell { position: fixed !important; top: 0 !important; left: 0 !important; }
`

/* The shell, its bar, and the page that floats inside it — the same for
   both portals, so the two windows read as the same browser. */
const glass = (mode) => {
  const g = GLASS[mode]
  return `
    .h-animation-ref, .ck-page, .ck-page.rr, .sb-shell {
      /* the Clerk drawing is scaled up by a tenth; at its own size its
         chrome is the same height as the other window's, to the pixel */
      width: 100% !important;
      height: ${H}px !important;
      transform: none !important;
      display: block !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 16px !important;
      overflow: hidden !important;
      background: ${g.shell} !important;
      box-shadow: inset 0 0 0 1px ${g.ring} !important;
    }
    /* The bar's own geometry, which the two drawings carry in their own
       stylesheets and the built portal does not. Writing it here once
       gives all three the same browser down to the stoplights. */
    .h-animation-ref-safari {
      display: flex !important;
      justify-content: space-between !important;
      position: absolute !important;
      top: 0 !important;
      width: 100% !important;
      z-index: 1 !important;
    }
    .h-animation-ref-safari-left {
      width: 150px !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      padding-left: 68px !important;
    }
    .h-animation-ref-safari-nav { width: 600px !important; padding: 6px 0 !important; }
    .h-animation-ref-safari-right {
      width: 150px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      gap: 10px !important;
      padding-right: 12px !important;
    }
    .h-animation-ref-safari-left svg { width: 16px !important; height: 16px !important; }
    .h-animation-ref-safari-left svg:last-of-type { opacity: 0.5 !important; }
    .h-animation-ref-safari-right svg { width: 17px !important; height: 17px !important; }
    .h-animation-ref-safari-nav-url svg {
      width: 13px !important;
      height: 13px !important;
      margin-right: 3px !important;
      position: static !important;
    }
    .h-animation-ref-safari-nav-url svg:last-of-type { position: absolute !important; right: 4px !important; }
    .dotted-top {
      position: absolute !important;
      top: 17px !important;
      width: 10px !important;
      height: 9px !important;
      border-radius: 50% !important;
    }
    .h-animation-ref-safari {
      height: 40px !important;
      background-color: ${g.bar} !important;
      box-shadow: inset 0 0 0 0.5px ${g.ring} !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
      border: 0 !important;
    }
    .dotted-top {
      left: 20px !important;
      background-color: ${g.lights} !important;
      box-shadow: 14px 0 0 ${g.lights}, 29px 0 0 ${g.lights} !important;
    }
    .h-animation-ref-safari-left,
    .h-animation-ref-safari-right {
      color: ${g.icon} !important;
    }
    .h-animation-ref-safari-nav-url {
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      position: relative !important;
      font-size: 13px !important;
      border-radius: 7px !important;
      border: 0 !important;
      background: ${g.pill} !important;
      box-shadow: inset 0 0 0 1px ${g.pillRing} !important;
      color: ${g.ink} !important;
    }
    .h-animation-ref-safari-nav-url svg { color: ${g.ink} !important; }
    /* the page: a card with the same gutter on every side, so the shell
       ends below it rather than being overrun by it */
    .gl-card {
      position: absolute !important;
      top: 40px !important;
      left: 10px !important;
      right: 10px !important;
      bottom: 10px !important;
      border-radius: 12px !important;
      overflow: hidden !important;
      box-shadow: ${g.lift} !important;
    }
  `
}

/* A browser showing a file: one block of monospace, nothing laid out, and
   no wrapping — the long lines run off the right edge, which is half of
   what makes it read as a file rather than a page. */
const view = (font, ink, paper) => `
  .gl-card { display: block !important; padding: 0 !important; }
  .md-view {
    height: 100%;
    padding: 20px 18px;
    background: ${paper};
    color: ${ink};
    font-family: ${font};
    /* big enough that a line of it reaches past the middle of the window,
       which is where the seam cuts: a file's right edge is ragged, and at
       a browser's own 13px almost nothing would cross */
    font-size: 17px;
    line-height: 1.62;
    white-space: pre;
    overflow: hidden;
  }
`

const ZOOM_MD = `---
title: Delete a meeting's archived files
description: Delete all of a meeting's archived files.
operation: DELETE https://api.zoom.us/v2/past_meetings/{meetingUUID}/archive_files
---

# Delete a meeting's archived files

Delete all of a meeting's archived files.

## Path Parameters

* \`meetingUUID\` (string, required) — The meeting's universally unique identifier (UUID). Each meeting instance generates a UUID. For example, after a meeting ends, a new UUID is generated for the next meeting instance. If the meeting UUID begins with a \`/\` character or contains a \`//\` character, you must double-encode the meeting UUID when using it for other API calls.

## Responses

* \`204\` Meeting archived file deleted.
* \`400\` Bad Request
* \`401\` Not Found
* \`404\` Not Found
* \`429\` Too Many Requests.

## Request

\`\`\`sh
curl https://api.zoom.us/v2/past_meetings/4444AAAiAA/archive_files \\
  --request DELETE \\
  --header 'Authorization: Bearer YOUR_SECRET_TOKEN'
\`\`\`

[Get a meeting's archived files](https://developers.zoom.us/docs/api/meetings) · [OAuth scopes](https://developers.zoom.us/docs/integrations/oauth-scopes)
`

const CLERK_MD = `---
title: Update environment
description: Update environment using request origin
operation: PATCH https://example-destined-camel-13.clerk.accounts.dev/v1/environment
---

# Update environment

Update environment using request origin

## Request

\`\`\`sh
curl https://example-destined-camel-13.clerk.accounts.dev/v1/environment \\
  --request PATCH \\
  --header 'Origin: https://example-destined-camel-13.clerk.accounts.dev'
\`\`\`

## Headers

* \`Origin\` (string, required) — Origin of the request

## Responses

### 200 — Returns the environment.

\`application/json\`

* \`auth_config\` (object) — \`object\`, \`id\`, \`first_name\`, \`last_name\`, \`email_address\`, \`phone_number\`, \`username\`, \`password\`
* \`display_config\` (object)
* \`user_settings\` (object)

### 400 — Request was not successful

### 401 — Request was not successful

[Frontend API](https://clerk.com/docs/reference/frontend-api) · [Backend API](https://clerk.com/docs/reference/backend-api)
`

/* the drawing is a window with no page of its own, so one is made out of
   everything standing under the chrome */
const REFERENCE_SHELL = `
  .gl-card {
    background: var(--scalar-background-1) !important;
    display: flex !important;
    /* the site's own header, which used to sit under the chrome */
    padding-top: 50px !important;
  }
  .h-animation-doc-header { top: 0 !important; }
  /* the sample keeps a line to a line, as a code panel does, rather than
     folding because the page is a little narrower inside the glass than
     the window it used to fill */
  .h-animation-endpoint-code-body div { flex-wrap: nowrap !important; }
  .h-animation-endpoint-code-body span { white-space: nowrap !important; }
`

const PORTALS = [
  {
    key: 'zoom',
    light: 'api-docs-static-zoom',
    dark: 'api-docs-static-zoom-dark',
    url: 'developers.zoom.us/docs/api/meetings',
    shell: '.h-animation-ref',
    page: null,
    css: REFERENCE_SHELL,
    markdown: {
      css: () => view('var(--scalar-font-code)', 'var(--scalar-color-1)', 'var(--scalar-background-1)'),
      text: ZOOM_MD,
    },
  },
  {
    key: 'clerk',
    light: 'clerk-docs-glass',
    dark: 'clerk-docs-glass-dark',
    url: 'clerk.com/docs/reference/backend-api/environment',
    shell: '.ck-page',
    page: '.ck-card',
    css: `
      .gl-card { background: var(--c-bg-1) !important; }
    `,
    markdown: { css: () => view('var(--font-code)', 'var(--c-text-1)', 'var(--c-bg-1)'), text: CLERK_MD },
  },
  {
    key: supabase.key,
    light: supabase.light,
    dark: supabase.dark,
    url: supabase.url,
    shell: '.h-animation-ref',
    page: null,
    css: `${REFERENCE_SHELL}\n${supabase.css}`,
    rewrite: supabase.rewrite,
    markdown: {
      css: () => view('var(--scalar-font-code)', 'var(--scalar-color-1)', 'var(--scalar-background-1)'),
      text: supabase.markdown,
    },
  },
]

const browser = await chromium.launch()
mkdirSync(PREVIEW, { recursive: true })
const made = []
for (const portal of PORTALS) {
  for (const side of ['reference', 'markdown']) {
    const dress = side === 'markdown' ? portal.markdown : null
    for (const [mode, name] of [
      ['light', portal.light],
      ['dark', portal.dark],
    ]) {
      const { css, body } = parts(name)
      const tab = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
      await tab.setContent(
        `<!doctype html><meta charset="utf-8"><style>${css}
${frame(mode)}
${glass(mode)}
${portal.css || ''}
${dress ? dress.css(mode) : ''}</style>${body}`,
      )
      await tab.evaluate(
        ([shellSelector, pageSelector, text, url, rewrite]) => {
          const shell = document.querySelector(shellSelector)
          if (!shell) {
            throw new Error(`no ${shellSelector}`)
          }
          /* another site's content in the same reference: the lockup, the
             sidebar's names and badges, and the operation itself */
          if (rewrite) {
            const label = (element, name) => {
              const inner = element.querySelector('em')
              const text = [...element.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim())
              if (inner) {
                inner.textContent = name
              } else if (text) {
                text.textContent = name
              } else {
                element.insertBefore(document.createTextNode(name), element.firstChild)
              }
            }
            document.querySelector('.h-animation-doc-header').innerHTML = rewrite.header
            const names = [rewrite.sidebar.folder, ...rewrite.sidebar.tags]
            ;[...document.querySelectorAll('.h-animation-sidebar-folder')].forEach((element, i) => {
              if (names[i]) {
                label(element, names[i])
              } else {
                element.remove()
              }
            })
            ;[...document.querySelectorAll('.h-animation-sidebar-endpoint')].forEach((element, i) => {
              const row = rewrite.sidebar.endpoints[i]
              if (!row) {
                element.remove()
                return
              }
              label(element, row[0])
              const badge = element.querySelector('span')
              if (badge) {
                badge.textContent = row[1]
                badge.className = row[2]
              }
            })
            document.querySelector('.h-animation-endpoint').innerHTML = rewrite.content
          }
          let card = pageSelector ? document.querySelector(pageSelector) : null
          if (card) {
            card.classList.add('gl-card')
          } else {
            card = document.createElement('div')
            card.className = 'gl-card'
            for (const child of [...shell.children]) {
              if (!child.matches('.h-animation-ref-safari')) {
                card.appendChild(child)
              }
            }
            shell.appendChild(card)
          }
          if (text) {
            card.innerHTML = ''
            const file = document.createElement('div')
            file.className = 'md-view'
            file.textContent = text
            card.appendChild(file)
          }
          /* The address is the same page either side of the seam, with
             the .md the markdown face is served at on the end. The bar
             centres its text, so a reference face three characters
             shorter would sit three characters to the right and the
             seam would cut a letter or two out of the middle of the
             word. Both faces therefore carry the .md and the reference
             only hides it, which keeps the two to the pixel. */
          const bar = document.querySelector('.h-animation-ref-safari-nav-url')
          if (bar) {
            for (const node of bar.childNodes) {
              if (node.nodeType === 3 && node.textContent.trim()) {
                const head = document.createElement('span')
                head.textContent = ` ${url}`
                const tail = document.createElement('span')
                tail.textContent = '.md '
                if (!text) {
                  tail.style.visibility = 'hidden'
                }
                node.replaceWith(head, tail)
                break
              }
            }
          }
        },
        [portal.shell, portal.page, dress ? dress.text : '', portal.url, dress ? null : portal.rewrite || null],
      )
      await tab.evaluate(() => document.fonts.ready)
      await tab.waitForTimeout(1400)
      const png = await tab.screenshot({ clip: { x: 0, y: 0, width: W, height: H } })
      await tab.close()

      const encoder = await browser.newPage()
      const webp = await encoder.evaluate(
        async ([data, quality, w, h]) => {
          const image = new Image()
          image.src = data
          await image.decode()
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          canvas.getContext('2d').drawImage(image, 0, 0, w, h)
          return canvas.toDataURL('image/webp', quality)
        },
        [`data:image/png;base64,${png.toString('base64')}`, QUALITY, W, H],
      )
      await encoder.close()
      const bytes = Buffer.from(webp.split(',')[1], 'base64')
      const file = `${portal.key}${side === 'markdown' ? '-markdown' : ''}${mode === 'dark' ? '-dark' : ''}.webp`
      writeFileSync(process.argv.includes('--write') ? `${OUT}/${file}` : `${PREVIEW}/${file}`, bytes)
      writeFileSync(`${PREVIEW}/face-${portal.key}-${side}-${mode}.png`, png)
      made.push({ file, kb: Math.round(bytes.length / 1024) })
    }
  }
}
await browser.close()
console.log(JSON.stringify({ size: `${W}x${H}`, made }, null, 1))
