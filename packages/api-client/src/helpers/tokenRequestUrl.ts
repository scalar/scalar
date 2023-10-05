// TODO: Implement this
const generateRandomString = () => {
  return 'foobar'
}

// TODO: Implement this
const redirectUri = ''

const getTokenConfiguration = async (oidcDiscoveryUrl: string) => {
  const options = {
    method: 'GET',
    headers: {
      'Content-type': 'application/json',
    },
  }

  try {
    const response = await fetch(oidcDiscoveryUrl, options)
    const config = await response.json()

    console.log('[getTokenConfiguration]', config)

    return config
  } catch (error) {
    console.error(error)

    return null
  }
}

export const tokenRequestUrl = async ({
  oidcDiscoveryUrl,
  grantType,
  authUrl,
  accessTokenUrl,
  clientId,
  clientSecret,
  scope,
}: {
  oidcDiscoveryUrl: string
  grantType: 'code'
  authUrl: string
  accessTokenUrl: string
  clientId: string
  clientSecret: string
  scope: string
}) => {
  // Check oauth configuration
  if (oidcDiscoveryUrl !== '') {
    // eslint-disable-next-line camelcase
    const { authorization_endpoint, token_endpoint } =
      await getTokenConfiguration(oidcDiscoveryUrl)
    // eslint-disable-next-line camelcase
    authUrl = authorization_endpoint
    // eslint-disable-next-line camelcase
    accessTokenUrl = token_endpoint
  }
  // Store oauth information
  // setLocalConfig('tokenEndpoint', accessTokenUrl)
  // setLocalConfig('client_id', clientId)
  // setLocalConfig('client_secret', clientSecret)

  // Create and store a random state value
  const state = generateRandomString()
  // setLocalConfig('pkce_state', state)

  // Create and store a new PKCE codeVerifier (the plaintext random secret)
  // const codeVerifier = generateRandomString()
  // setLocalConfig('pkce_codeVerifier', codeVerifier)

  // Hash and base64-urlencode the secret to use as the challenge
  // const codeChallenge = await pkceChallengeFromVerifier(codeVerifier)
  const codeChallenge = 'foobar'

  // Build the authorization URL
  const buildUrl = () =>
    `${authUrl + `?response_type=${grantType}`}&client_id=${encodeURIComponent(
      clientId,
    )}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(
      scope,
    )}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&code_challenge=${encodeURIComponent(
      codeChallenge,
    )}&code_challenge_method=S256`

  // Redirect to the authorization server
  return buildUrl()
}
