import type { Plugin } from 'vite'

const LOCALHOST_MEDIA_SOURCES = 'http://127.0.0.1:* http://localhost:*'

/**
 * While the Vite dev server runs, allow images and media from localhost URLs in
 * the HTML meta CSP (Electron uses file:// + remote assets; web dev uses another origin).
 */
export const devLocalhostCspPlugin = (): Plugin => ({
  name: 'scalar-app-dev-localhost-csp',
  transformIndexHtml(html, ctx) {
    if (!ctx.server) {
      return html
    }
    return html
      .replace(/(img-src[^;]+);/g, `$1 ${LOCALHOST_MEDIA_SOURCES};`)
      .replace(/(media-src[^;]+);/g, `$1 ${LOCALHOST_MEDIA_SOURCES};`)
  },
})
