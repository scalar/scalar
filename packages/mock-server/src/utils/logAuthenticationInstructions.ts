import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { getPathFromUrl } from './getOpenAuthTokenUrls'

/**
 * Log authentication instructions for different security schemes
 */
export function logAuthenticationInstructions(securitySchemes: Record<string, OpenAPIV3_1.SecuritySchemeObject>) {
  if (!securitySchemes || Object.keys(securitySchemes).length === 0) {
    return
  }

  console.log('Authentication:')
  console.log()

  Object.entries(securitySchemes).forEach(([_, scheme]) => {
    switch (scheme.type) {
      case 'apiKey':
        if (scheme.in === 'header') {
          console.log('✅ API Key Authentication')
          console.log(`   Use any API key in the ${scheme.name} header`)
          console.log()
          console.log(`   ${scheme.name}: YOUR_API_KEY_HERE`)
          console.log()
        } else if (scheme.in === 'query') {
          console.log('✅ API Key Authentication')
          console.log(`   Use any API key in the ${scheme.name} query parameter:`)
          console.log()
          console.log(`   ?${scheme.name}=YOUR_API_KEY_HERE`)
          console.log()
        } else if (scheme.in === 'cookie') {
          console.log('✅ API Key Authentication')
          console.log(`   Use any API key in the ${scheme.name} cookie:`)
          console.log()
          console.log(`   Cookie: ${scheme.name}=YOUR_API_KEY_HERE`)
          console.log()
        } else {
          console.error(`❌ Unsupported API Key Location: ${scheme.in}`)
        }
        break
      case 'http':
        if (scheme.scheme === 'basic') {
          console.log('✅ HTTP Basic Authentication')
          console.log('   Use an Authorization header with any credentials ("username:password" in base64):')
          console.log()
          console.log('   Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=')
          console.log()
        } else if (scheme.scheme === 'bearer') {
          console.log('✅ Bearer Token Authentication')
          console.log('   Use an Authorization header with any bearer token')
          console.log()
          console.log('   Authorization: Bearer YOUR_TOKEN_HERE')
          console.log()
        } else {
          console.error('❌ Unknown Security Scheme:', scheme)
        }

        break
      case 'oauth2':
        if (scheme.flows) {
          Object.keys(scheme.flows).forEach((flow) => {
            switch (flow) {
              case 'implicit':
                console.log('✅ OAuth 2.0 Implicit Flow')
                console.log('   Use the following URL to initiate the OAuth 2.0 Implicit Flow:')
                console.log()
                console.log(
                  `   GET ${scheme?.flows?.implicit?.authorizationUrl || '/oauth/authorize'}?response_type=token&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=YOUR_SCOPES`,
                )
                console.log()
                break
              case 'password':
                console.log('✅ OAuth 2.0 Password Flow')
                console.log('   Use the following URL to obtain an access token:')
                console.log()
                console.log(`   POST ${getPathFromUrl(scheme?.flows?.password?.tokenUrl || '/oauth/token')}`)
                console.log('   Content-Type: application/x-www-form-urlencoded')
                console.log()
                console.log(
                  '   grant_type=password&username=YOUR_USERNAME&password=YOUR_PASSWORD&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET',
                )
                console.log()
                break
              case 'clientCredentials':
                console.log('✅ OAuth 2.0 Client Credentials Flow')
                console.log('   Use the following URL to obtain an access token:')
                console.log()
                console.log(`   POST ${getPathFromUrl(scheme?.flows?.clientCredentials?.tokenUrl || '/oauth/token')}`)
                console.log('   Content-Type: application/x-www-form-urlencoded')
                console.log()
                console.log(
                  '   grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET',
                )
                console.log()
                break
              case 'authorizationCode':
                console.log('✅ OAuth 2.0 Authorization Code Flow')
                console.log('   Use the following URL to initiate the OAuth 2.0 Authorization Code Flow:')
                console.log()
                console.log(
                  '   GET',
                  `${getPathFromUrl(scheme?.flows?.authorizationCode?.authorizationUrl || '/oauth/authorize')}?redirect_uri=https://YOUR_REDIRECT_URI_HERE`,
                )
                console.log()
                break
              default:
                console.warn(`Unsupported OAuth 2.0 flow: ${flow}`)
            }
          })
        }
        break
      case 'openIdConnect':
        console.log('✅ OpenID Connect Authentication')
        console.log('   Use the following OpenID Connect discovery URL:')
        console.log()
        console.log(`   ${getPathFromUrl(scheme.openIdConnectUrl || '/.well-known/openid-configuration')}`)
        console.log()
        break
      default:
        console.warn(`Unsupported security scheme type: ${scheme.type}`)
    }
  })
}
