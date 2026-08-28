import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

import { getPathFromUrl } from './get-open-auth-token-urls'

/** Options for {@link logAuthenticationInstructions} */
type LogAuthenticationInstructionsOptions = {
  /** Skip the instructions. Warnings and errors about unsupported schemes are printed either way. */
  quiet?: boolean
}

/**
 * Log authentication instructions for different security schemes
 */
export function logAuthenticationInstructions(
  securitySchemes: Record<string, OpenAPIV3_1.SecuritySchemeObject>,
  options?: LogAuthenticationInstructionsOptions,
) {
  if (!securitySchemes || Object.keys(securitySchemes).length === 0) {
    return
  }

  // Only the instructions are optional. Somebody who asks for a quiet startup still wants to hear
  // about security schemes the mock server cannot handle, so the diagnostics below stay unconditional.
  const log = options?.quiet ? () => undefined : (...args: unknown[]) => console.log(...args)

  log('Authentication:')
  log()

  Object.entries(securitySchemes).forEach(([_, rawScheme]) => {
    const scheme = getResolvedRef(rawScheme)

    // Skip schemes that could not be resolved (e.g. a `$ref` to a missing component)
    if (!scheme) {
      return
    }

    switch (scheme.type) {
      case 'apiKey':
        if (scheme.in === 'header') {
          log('✅ API Key Authentication')
          log(`   Use any API key in the ${scheme.name} header`)
          log()
          log(`   ${scheme.name}: YOUR_API_KEY_HERE`)
          log()
        } else if (scheme.in === 'query') {
          log('✅ API Key Authentication')
          log(`   Use any API key in the ${scheme.name} query parameter:`)
          log()
          log(`   ?${scheme.name}=YOUR_API_KEY_HERE`)
          log()
        } else if (scheme.in === 'cookie') {
          log('✅ API Key Authentication')
          log(`   Use any API key in the ${scheme.name} cookie:`)
          log()
          log(`   Cookie: ${scheme.name}=YOUR_API_KEY_HERE`)
          log()
        } else {
          console.error(`❌ Unsupported API Key Location: ${scheme.in}`)
        }
        break
      case 'http':
        if (scheme.scheme === 'basic') {
          log('✅ HTTP Basic Authentication')
          log('   Use an Authorization header with any credentials ("username:password" in base64):')
          log()
          log('   Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=')
          log()
        } else if (scheme.scheme === 'bearer') {
          log('✅ Bearer Token Authentication')
          log('   Use an Authorization header with any bearer token')
          log()
          log('   Authorization: Bearer YOUR_TOKEN_HERE')
          log()
        } else {
          console.error('❌ Unknown Security Scheme:', scheme)
        }

        break
      case 'oauth2':
        if (scheme.flows) {
          Object.keys(scheme.flows).forEach((flow) => {
            switch (flow) {
              case 'implicit':
                log('✅ OAuth 2.0 Implicit Flow')
                log('   Use the following URL to initiate the OAuth 2.0 Implicit Flow:')
                log()
                log(
                  `   GET ${scheme?.flows?.implicit?.authorizationUrl || '/oauth/authorize'}?response_type=token&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=YOUR_SCOPES`,
                )
                log()
                break
              case 'password':
                log('✅ OAuth 2.0 Password Flow')
                log('   Use the following URL to obtain an access token:')
                log()
                log(`   POST ${getPathFromUrl(scheme?.flows?.password?.tokenUrl || '/oauth/token')}`)
                log('   Content-Type: application/x-www-form-urlencoded')
                log()
                log(
                  '   grant_type=password&username=YOUR_USERNAME&password=YOUR_PASSWORD&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET',
                )
                log()
                break
              case 'clientCredentials':
                log('✅ OAuth 2.0 Client Credentials Flow')
                log('   Use the following URL to obtain an access token:')
                log()
                log(`   POST ${getPathFromUrl(scheme?.flows?.clientCredentials?.tokenUrl || '/oauth/token')}`)
                log('   Content-Type: application/x-www-form-urlencoded')
                log()
                log('   grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET')
                log()
                break
              case 'authorizationCode':
                log('✅ OAuth 2.0 Authorization Code Flow')
                log('   Use the following URL to initiate the OAuth 2.0 Authorization Code Flow:')
                log()
                log(
                  '   GET',
                  `${getPathFromUrl(scheme?.flows?.authorizationCode?.authorizationUrl || '/oauth/authorize')}?redirect_uri=https://YOUR_REDIRECT_URI_HERE`,
                )
                log()
                break
              default:
                console.warn(`Unsupported OAuth 2.0 flow: ${flow}`)
            }
          })
        }
        break
      case 'openIdConnect':
        log('✅ OpenID Connect Authentication')
        log('   Use the following OpenID Connect discovery URL:')
        log()
        log(`   ${getPathFromUrl(scheme.openIdConnectUrl || '/.well-known/openid-configuration')}`)
        log()
        break
      default:
        console.warn(`Unsupported security scheme type: ${scheme.type}`)
    }
  })
}
