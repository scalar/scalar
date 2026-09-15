import type { OpenAPI, OpenAPIV3_2 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { Hono } from 'hono'
import { html } from 'hono/html'

import { getPathFromUrl } from './get-open-auth-token-urls'

type DeviceGrant = {
  clientId: string
  userCode: string
  tokenPath: string
  expiresAt: number
  nextPoll: number
  interval: number
  status: 'pending' | 'approved' | 'denied'
}

/** Keeps the device form and its outcomes consistent with the mock OAuth authorization page. */
const renderDevicePage = (
  title: string,
  heading: string,
  content: ReturnType<typeof html>,
): ReturnType<typeof html> => html`
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${heading}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; min-height: 100svh; display: grid; place-items: center; padding: 32px 16px; background: #f3f4f6; color: #4b5563; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 14px; line-height: 1.5; }
        main { width: 100%; max-width: 448px; }
        .brand { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px; color: #111827; font-size: 18px; font-weight: 500; }
        .brand img { width: 24px; }
        .brand span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .card { padding: 4px; border-radius: 8px; background: #f9fafb; box-shadow: 0 1px 3px #0000001a, 0 1px 2px #0000001a; }
        h1 { margin: 0; padding: 8px 24px 12px; color: #1f2937; font-size: 16px; font-weight: 500; }
        .content { padding: 24px; border-radius: 4px; background: white; }
        p { margin: 0 0 20px; }
        .content > p:last-child { margin-bottom: 0; }
        label { display: block; margin-bottom: 8px; color: #374151; font-weight: 500; }
        input { width: 100%; min-width: 0; padding: 12px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb; color: #111827; font: 18px ui-monospace, monospace; letter-spacing: .15em; }
        .actions { display: flex; flex-direction: row-reverse; justify-content: space-between; gap: 12px; margin-top: 24px; }
        button { padding: 8px 24px; border: 1px solid #e5e7eb; border-radius: 4px; background: white; color: #4b5563; font: inherit; cursor: pointer; }
        button:hover { background: #f3f4f6; }
        button[value="approve"] { border-color: black; background: black; color: white; }
        button[value="approve"]:hover { background: #1f2937; }
        :focus-visible { outline: 2px solid #2563eb; outline-offset: 3px; }
        footer { margin-top: 20px; color: #6b7280; text-align: center; font-size: 12px; }
        a { color: #4b5563; text-underline-offset: 2px; }
      </style>
    </head>
    <body>
      <main>
        <div class="brand">
          <img src="https://cdn.scalar.com/images/logo-dark.svg" alt="Scalar">
          <span>${title}</span>
        </div>
        <section class="card" aria-labelledby="page-title">
          <h1 id="page-title">${heading}</h1>
          <div class="content">${content}</div>
        </section>
        <footer>
          This authorization page is provided by the
          <a href="https://scalar.com/tools/mock-server/getting-started" target="_blank" rel="noopener noreferrer">Scalar Mock Server</a>.
        </footer>
      </main>
    </body>
  </html>
`

/** Registers a local RFC8628 approval flow before the permissive mock token handlers. */
export const setUpDeviceAuthorization = (app: Hono, document?: OpenAPI.Document): void => {
  const title = document?.info?.title ?? ''
  const grants = new Map<string, DeviceGrant>()
  const devicePaths = new Map<string, string>()
  const securitySchemes: Record<string, OpenAPIV3_2.SecuritySchemeObject> = document?.components?.securitySchemes ?? {}
  for (const rawScheme of Object.values(securitySchemes)) {
    const scheme = getResolvedRef(rawScheme)
    if (scheme?.type === 'oauth2' && scheme.flows?.deviceAuthorization) {
      const flow = scheme.flows.deviceAuthorization
      devicePaths.set(
        getPathFromUrl(flow.deviceAuthorizationUrl || '/oauth/device'),
        getPathFromUrl(flow.tokenUrl || '/oauth/token'),
      )
    }
  }
  const tokenPaths = new Set(devicePaths.values())
  const removeExpired = (): void => {
    for (const [code, grant] of grants) {
      if (grant.expiresAt <= Date.now()) {
        grants.delete(code)
      }
    }
  }
  for (const [devicePath, tokenPath] of devicePaths) {
    const verificationPath = `${devicePath.replace(/\/$/, '')}/verify`
    app.post(devicePath, async (c) => {
      const body = await c.req.parseBody()
      const basic = c.req.header('Authorization')
      const clientId =
        typeof body.client_id === 'string'
          ? body.client_id
          : basic?.startsWith('Basic ')
            ? Buffer.from(basic.slice(6), 'base64').toString().split(':')[0]
            : ''
      c.header('Cache-Control', 'no-store')
      c.header('Pragma', 'no-cache')
      if (!clientId) {
        return c.json({ error: 'invalid_request', error_description: 'Missing client_id' }, 400)
      }
      removeExpired()
      const deviceCode = crypto.randomUUID()
      const userCode = crypto.randomUUID().slice(0, 8).toUpperCase()
      grants.set(deviceCode, {
        clientId,
        userCode,
        tokenPath,
        expiresAt: Date.now() + 600000,
        nextPoll: 0,
        interval: 5000,
        status: 'pending',
      })
      const verificationUri = new URL(verificationPath, c.req.url).href
      return c.json({
        device_code: deviceCode,
        user_code: userCode,
        verification_uri: verificationUri,
        verification_uri_complete: `${verificationUri}?user_code=${userCode}`,
        expires_in: 600,
        interval: 5,
      })
    })
    app.get(verificationPath, (c) =>
      c.html(
        renderDevicePage(
          title,
          'Authorize device',
          html`
          <p>Enter the code shown in your API client to approve this mock authorization request.</p>
          <form method="post">
            <label for="user-code">Device code</label>
            <input id="user-code" name="user_code" required value="${c.req.query('user_code') ?? ''}" autocomplete="one-time-code" spellcheck="false" autocapitalize="characters">
            <div class="actions">
              <button name="decision" value="approve">Approve</button>
              <button name="decision" value="deny">Deny</button>
            </div>
          </form>
        `,
        ),
      ),
    )
    app.post(verificationPath, async (c) => {
      const body = await c.req.parseBody()
      const grant = [...grants.values()].find(
        (entry) => entry.userCode === String(body.user_code).trim().toUpperCase() && entry.tokenPath === tokenPath,
      )
      if (!grant || grant.expiresAt <= Date.now() || grant.status !== 'pending') {
        return c.html(
          renderDevicePage(
            title,
            'Invalid or expired device code',
            html`<p>Start a new authorization request in your API client and enter the new device code.</p>`,
          ),
          400,
        )
      }
      if (body.decision !== 'approve' && body.decision !== 'deny') {
        return c.html(
          renderDevicePage(
            title,
            'Choose Approve or Deny',
            html`<p>Return to the device authorization form and choose whether to approve or deny the request.</p>`,
          ),
          400,
        )
      }
      grant.status = body.decision === 'approve' ? 'approved' : 'denied'
      return c.html(
        renderDevicePage(
          title,
          grant.status === 'approved' ? 'Device authorized' : 'Device authorization denied',
          grant.status === 'approved'
            ? html`<p>Device authorized. You can return to your API client.</p>`
            : html`<p>Device authorization denied. You can return to your API client to start a new request.</p>`,
        ),
      )
    })
  }
  for (const tokenPath of tokenPaths) {
    app.post(tokenPath, async (c, next) => {
      const body = await c.req.parseBody()
      if (body.grant_type !== 'urn:ietf:params:oauth:grant-type:device_code') {
        return next()
      }
      c.header('Cache-Control', 'no-store')
      c.header('Pragma', 'no-cache')
      const basic = c.req.header('Authorization')
      const clientId =
        typeof body.client_id === 'string'
          ? body.client_id
          : basic?.startsWith('Basic ')
            ? Buffer.from(basic.slice(6), 'base64').toString().split(':')[0]
            : ''
      const code = String(body.device_code ?? '')
      const grant = grants.get(code)
      if (!grant || grant.tokenPath !== tokenPath || grant.clientId !== clientId) {
        return c.json({ error: 'invalid_grant' }, 400)
      }
      if (grant.expiresAt <= Date.now()) {
        grants.delete(code)
        return c.json({ error: 'expired_token' }, 400)
      }
      if (Date.now() < grant.nextPoll) {
        grant.interval += 5000
        grant.nextPoll = Date.now() + grant.interval
        return c.json({ error: 'slow_down' }, 400)
      }
      grant.nextPoll = Date.now() + grant.interval
      if (grant.status === 'pending') {
        return c.json({ error: 'authorization_pending' }, 400)
      }
      grants.delete(code)
      if (grant.status === 'denied') {
        return c.json({ error: 'access_denied' }, 400)
      }
      return c.json({
        access_token: 'super-secret-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'example-refresh-token',
      })
    })
  }
}
