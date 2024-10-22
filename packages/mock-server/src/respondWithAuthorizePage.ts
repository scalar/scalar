import type { Context } from 'hono'

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
<style>
    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .container { text-align: center; padding: 20px; border: 1px solid #ccc; border-radius: 5px; }
    .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
</style>
</head>
<body>
<div class="container">
    <h1>OAuth 2.0 Authorization</h1>
    <p>Click the button below to authorize the application:</p>
    <a href="${redirectUrl}" class="button">Authorize</a>
</div>
</body>
</html>
  `
}
