import type { Context } from 'hono'

/** Always responds with this code */
const EXAMPLE_AUTHORIZATION_CODE = 'super-secret-token'

/**
 * Responds with an HTML page that simulates an OAuth 2.0 authorization page.
 */
export function respondWithAuthorizePage(c: Context, title: string = '') {
  const redirectUri = c.req.query('redirect_uri')
  const state = c.req.query('state')

  if (!redirectUri) {
    const errorMessage = `
      <html>
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
              Error: Missing redirect_uri parameter
            </h1>
            <p>
              This parameter is required for the OAuth 2.0 authorization flow to function correctly.
              Please provide a valid redirect URI in your request.
            </p>
            <p>
              Example: <code class="bg-gray-100 py-1 px-2 rounded text-base"><a href="?redirect_uri=https://example.com/callback">?redirect_uri=https://example.com/callback</a></code>
            </p>
          </div>
        </body>
      </html>
    `
    return c.html(errorMessage, 400)
  }

  const redirectUrl = new URL(redirectUri)

  redirectUrl.searchParams.set('code', EXAMPLE_AUTHORIZATION_CODE)

  if (state) {
    redirectUrl.searchParams.set('state', state)
  }

  const htmlContent = generateAuthorizationHtml(redirectUrl.toString(), title)

  return c.html(htmlContent)
}

function generateAuthorizationHtml(redirectUrl: string, title: string = '') {
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
        <div class="font-semibold truncate max-w-[26ch] text-lg">
          ${title}
        </div>
      </div>
      <div class="bg-white rounded-lg w-[28rem] shadow border-gray-200">
        <h1 class="text font-semibold text-gray-800 p-4 flex gap-3 bg-gray-50 rounded-t-lg">
          <span>
            OAuth 2.0 Authorization
          </span>
        </h1>
        <div class="text-gray-600 text-base p-4 flex flex-col gap-3">
          <p>
            This application is requesting access to your account. By granting authorization, you allow the application to perform certain actions on your behalf.
          </p>
          <p>
            If you’re comfortable with the access being requested, click the button below to grant authorization:
          </p>
        </div>
        <div class="p-4 flex justify-between">
          <a href="javascript:history.back()" class="inline-block px-8 py-2 text-gray-500 rounded border">
            Cancel
          </a>
          <a href="${redirectUrl}" class="inline-block px-8 py-2 bg-black text-white rounded transition-colors duration-300 hover:bg-gray-800">
            Authorize
          </a>
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
