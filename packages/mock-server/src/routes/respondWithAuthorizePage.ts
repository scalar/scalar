import type { Context } from 'hono'

/** Always responds with this code */
const EXAMPLE_AUTHORIZATION_CODE = 'super-secret-token'

/**
 * Responds with an HTML page that simulates an OAuth 2.0 authorization page.
 */
export function respondWithAuthorizePage(c: Context, title = '') {
  const redirectUri = c.req.query('redirect_uri')
  const state = c.req.query('state')

  if (!redirectUri) {
    return c.html(
      generateErrorHtml(
        'Missing redirect_uri parameter',
        'This parameter is required for the OAuth 2.0 authorization flow to function correctly. Please provide a valid redirect URI in your request.',
      ),
      400,
    )
  }

  try {
    // Validate redirect URI against allowed domains
    const redirectUrl = new URL(redirectUri)

    redirectUrl.searchParams.set('code', EXAMPLE_AUTHORIZATION_CODE)

    if (state) {
      redirectUrl.searchParams.set('state', state)
    }

    const deniedUrl = new URL(redirectUri)
    if (state) {
      deniedUrl.searchParams.set('state', state)
    }
    deniedUrl.searchParams.set('error', 'access_denied')
    deniedUrl.searchParams.set('error_description', 'User has denied the authorization request')

    const htmlContent = generateAuthorizationHtml(redirectUrl.toString(), deniedUrl.toString(), title)

    return c.html(htmlContent)
  } catch {
    return c.html(
      generateErrorHtml(
        'Invalid redirect_uri format',
        'Please provide a valid URL. The redirect_uri parameter must be a properly formatted URL that includes the protocol (e.g., https://) and a valid domain. This is essential for the OAuth 2.0 flow to securely redirect after authorization.',
      ),
      400,
    )
  }
}

function generateAuthorizationHtml(redirectUrl: string, deniedUrl: string, title = '') {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OAuth 2.0 Authorization</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="flex justify-center items-center h-screen bg-gray-100">

    <div class="flex flex-col">
      <div class="mb-5 flex justify-center items-center gap-2">
        <img src="https://scalar.com/logo-dark.svg" class="w-6 inline-block" />
        <div class="font-medium truncate max-w-[26ch] text-lg">
          ${title}
        </div>
      </div>
      <div class="bg-gray-50 rounded-lg p-1 rounded-lg w-[28rem] shadow">
        <div class="">
          <h1 class="text font-medium text-gray-800 px-6 pt-2 pb-3 flex gap-3 rounded-t-lg">
            OAuth 2.0 Authorization
          </h1>
          <div class="bg-white rounded">
            <div class="text-gray-600 text-base px-6 py-5 flex flex-col gap-3">
              <p>
                This application is requesting access to your account. By granting authorization, you allow the application to perform certain actions on your behalf.
              </p>
              <p>
                If you're comfortable with the access being requested, click the button below to grant authorization:
              </p>
            </div>
            <div class="px-6 py-4 pt-0 flex justify-between">
              <a href="${deniedUrl}" class="inline-block px-6 py-2 text-gray-600 rounded border" aria-label="Cancel authorization">
                Cancel
              </a>
              <a href="${redirectUrl}" class="inline-block px-6 py-2 bg-black text-white rounded transition-colors duration-300 hover:bg-gray-800" aria-label="Authorize application">
                Authorize
              </a>
            </div>
          </div>
        </div>
      </div>

      <p class="text-xs text-gray-400 mt-5 text-center">
        This authorization page is provided by @scalar/mock-server
      </p>

    </div>
  </body>
</html>
  `
}

function generateErrorHtml(title: string, message: string) {
  return `<html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OAuth 2.0 Authorization</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div class="p-4 m-8 flex flex-col gap-4 text-lg">
      <h1 class="font-bold">
        Error: ${title}
      </h1>
      <p>
        ${message}
      </p>
      <p>
        Example: <code class="bg-gray-100 py-1 px-2 rounded text-base"><a href="?redirect_uri=https://example.com/callback">?redirect_uri=https://example.com/callback</a></code>
      </p>
    </div>
  </body>
</html>`
}
