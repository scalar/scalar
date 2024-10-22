import type { Context } from 'hono'

/**
 * Responds with an HTML page that simulates an OAuth 2.0 authorization page.
 */
export function respondWithAuthorizePage(c: Context) {
  const redirectUri = c.req.query('redirect_uri')
  const state = c.req.query('state')
  const code = 'super-secret-token'

  if (!redirectUri) {
    return c.text('Missing redirect_uri', 400)
  }

  const redirectUrl = new URL(redirectUri)

  redirectUrl.searchParams.set('code', code)

  if (state) {
    redirectUrl.searchParams.set('state', state)
  }

  const htmlContent = generateAuthorizationHtml(redirectUrl.toString())
  return c.html(htmlContent)
}
function generateAuthorizationHtml(redirectUrl: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OAuth 2.0 Authorization</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="flex justify-center items-center h-screen">
  <div class="text-center py-8 px-4 bg-white shadow-xl rounded-lg w-96 border">
    <h1 class="text-2xl font-bold mb-4">
      OAuth 2.0 Authorization
    </h1>
    <p class="mb-6">
      This application is requesting access to your account. Click the button below to grant authorization:
    </p>
    <a href="${redirectUrl}" class="inline-block px-8 py-3 bg-black text-white font-semibold rounded">Authorize</a>
  </div>
</body>
</html>
  `
}
