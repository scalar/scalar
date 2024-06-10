<script lang="ts" setup>
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-parser'
import { useToasts } from '@scalar/use-toasts'
import { computed } from 'vue'

import {
  concatenateUrlAndPath,
  getUrlFromServerState,
  redirectToProxy,
} from '../../../../helpers'
import { useAuthenticationStore, useServerStore } from '../../../../stores'
// import { MarkdownRenderer } from '../../MarkdownRenderer'
import CardForm from './CardForm.vue'
import CardFormButton from './CardFormButton.vue'
import CardFormGroup from './CardFormGroup.vue'
import CardFormRows from './CardFormRows.vue'
import CardFormTextInput from './CardFormTextInput.vue'
import SecuritySchemeScopes from './SecuritySchemeScopes.vue'

defineProps<{
  value?:
    | OpenAPIV2.SecuritySchemeObject
    | OpenAPIV3.SecuritySchemeObject
    | OpenAPIV3_1.SecuritySchemeObject
  proxy?: string
}>()

const { toast } = useToasts()

const { server } = useServerStore()

const { authentication, setAuthentication } = useAuthenticationStore()

const handleApiKeyTokenInput = (event: Event) => {
  setAuthentication({
    apiKey: {
      ...authentication.apiKey,
      token: (event.target as HTMLInputElement).value,
    },
  })
}

const handleHttpBasicUsernameInput = (event: Event) => {
  setAuthentication({
    http: {
      ...authentication.http,
      basic: {
        ...authentication.http.basic,
        username: (event.target as HTMLInputElement).value,
      },
    },
  })
}

const handleHttpBasicPasswordInput = (event: Event) => {
  setAuthentication({
    http: {
      ...authentication.http,
      basic: {
        ...authentication.http.basic,
        password: (event.target as HTMLInputElement).value,
      },
    },
  })
}

const handleHttpBearerTokenInput = (event: Event) => {
  setAuthentication({
    http: {
      ...authentication.http,
      bearer: {
        ...authentication.http.bearer,
        token: (event.target as HTMLInputElement).value,
      },
    },
  })
}

const handleOpenAuth2ClientIdInput = (event: Event) => {
  setAuthentication({
    oAuth2: {
      ...authentication.oAuth2,
      clientId: (event.target as HTMLInputElement).value,
    },
  })
}

const handleOAuth2UsernameInput = (event: Event) => {
  setAuthentication({
    oAuth2: {
      ...authentication.oAuth2,
      username: (event.target as HTMLInputElement).value,
    },
  })
}

const handleOAuth2PasswordInput = (event: Event) => {
  setAuthentication({
    oAuth2: {
      ...authentication.oAuth2,
      password: (event.target as HTMLInputElement).value,
    },
  })
}

function getOpenAuth2AuthorizationUrl(flow: any) {
  // https://example.com/oauth/authorize?
  //   response_type=token
  //   &client_id=123
  //   &redirect_uri=https%3A%2F%2Fexample.com%2Foauth2%2Fredirect
  //   &scope=write%3Apets%20read%3Apets
  //   &state=something-random

  const scopes = authentication.oAuth2.scopes.join(' ')
  const state = (Math.random() + 1).toString(36).substring(7)
  const url = new URL(flow.authorizationUrl)
  setAuthentication({
    oAuth2: { ...authentication.oAuth2, state },
  })

  url.searchParams.set('response_type', 'token')
  url.searchParams.set('client_id', authentication.oAuth2.clientId)
  url.searchParams.set('redirect_uri', window.location.href)
  url.searchParams.set('scope', scopes)
  url.searchParams.set('state', state)

  return url.toString()
}

function authorizeWithPassword(
  tokenUrl?: string,
  options?: {
    baseUrl?: string
    proxy?: string
  },
) {
  // Require tokenUrl
  if (typeof tokenUrl !== 'string') {
    console.log('tokenUrl is not a string')
    return
  }

  // Append baseUrl to tokenUrl if it’s a relative path
  const urlAndPath =
    options?.baseUrl && !tokenUrl.startsWith('http')
      ? concatenateUrlAndPath(options?.baseUrl, tokenUrl)
      : tokenUrl

  // POST https://api.authorization-server.com/token
  //   grant_type=password&
  //   username=USERNAME&
  //   password=PASSWORD&
  //   client_id=CLIENT_ID
  const url = new URL(urlAndPath)
  url.searchParams.set('grant_type', 'password')
  url.searchParams.set('username', authentication.oAuth2.username)
  url.searchParams.set('password', authentication.oAuth2.password)
  url.searchParams.set('client_id', authentication.oAuth2.clientId)
  url.searchParams.set('scope', authentication.oAuth2.scopes.join(' '))

  // TODO: Proxy this request
  fetch(
    options?.proxy
      ? redirectToProxy(options?.proxy, url.toString())
      : url.toString(),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  )
    .then((response) => {
      // Check if is a 2xx response
      if (!response.ok) {
        throw new Error(
          'Failed to get an access token. Please check your credentials.',
        )
      }

      return response.json()
    })
    .then((data) => {
      setAuthentication({
        oAuth2: { ...authentication.oAuth2, accessToken: data.access_token },
      })
    })
    .catch((response) => {
      toast(`Couldn’t retrieve the password grant token`, 'warn', {
        description: 'Open your browser console to get more information.',
      })
      console.error('[authorizeWithPassword]', response)
    })
}

const oauth2SelectedScopes = computed<string[]>({
  get: () => authentication.oAuth2.scopes,
  set: (scopes) =>
    setAuthentication({ oAuth2: { ...authentication.oAuth2, scopes } }),
})

// Open oauth popup and set auth on success
const startAuthentication = (url: string) => {
  const windowFeatures = 'left=100,top=100,width=800,height=600'
  const authWindow = window.open(url, 'openAuth2Window', windowFeatures)

  if (authWindow) {
    const checkWindowClosed = setInterval(function () {
      try {
        const urlParams = new URLSearchParams(authWindow.location.href)
        const accessToken = urlParams.get('access_token')

        if (authWindow.closed || accessToken) {
          clearInterval(checkWindowClosed)

          // State is a hash fragment and cannot be found through search params
          const state = authWindow.location.href.match(/state=([^&]*)/)?.[1]
          if (accessToken && authentication.oAuth2.state === state) {
            setAuthentication({
              oAuth2: { ...authentication.oAuth2, accessToken },
            })
          }
          authWindow.close()
        }
      } catch {
        // Ignore CORS error from popup
      }
    }, 200)
  }
}
</script>
<template>
  <CardForm v-if="value && value?.type">
    <!-- API Key -->
    <CardFormTextInput
      v-if="value.type === 'apiKey'"
      :id="`security-scheme-${value.name}`"
      placeholder="Token"
      type="password"
      :value="authentication.apiKey.token"
      @input="handleApiKeyTokenInput">
      <template v-if="value.in">
        {{ value.in?.charAt(0)?.toUpperCase() + value.in?.slice(1) }}
      </template>
      API
    </CardFormTextInput>

    <!-- HTTP Basic Auth -->
    <template v-else-if="value.type === 'http' || value.type === 'basic'">
      <!-- @vue-ignore -->
      <CardFormGroup v-if="value.type === 'basic' || value.scheme === 'basic'">
        <CardFormTextInput
          id="http.basic.username"
          placeholder="Username"
          :value="authentication.http.basic.username"
          @input="handleHttpBasicUsernameInput">
          Username
        </CardFormTextInput>
        <CardFormTextInput
          id="http.basic.password"
          placeholder="Password"
          type="password"
          :value="authentication.http.basic.password"
          @input="handleHttpBasicPasswordInput">
          Password
        </CardFormTextInput>
      </CardFormGroup>
      <CardFormTextInput
        v-else-if="value.type === 'http' && value.scheme === 'bearer'"
        id="http.bearer.token"
        placeholder="Token"
        type="password"
        :value="authentication.http.bearer.token"
        @input="handleHttpBearerTokenInput">
        Bearer Token
      </CardFormTextInput>
    </template>

    <!-- OpenAuth2 -->
    <CardFormGroup
      v-else-if="
        value.type.toLowerCase() === 'oauth2' &&
        (
          value as
            | OpenAPIV3.OAuth2SecurityScheme
            | OpenAPIV3_1.OAuth2SecurityScheme
        ).flows
      ">
      <!-- Implicit Flow -->
      <template v-if="(value as any).flows.implicit">
        <template v-if="authentication.oAuth2.accessToken">
          <CardFormTextInput
            id="oAuth2.accessToken"
            placeholder="xxxxx"
            type="password"
            :value="authentication.oAuth2.accessToken">
            Access Token
          </CardFormTextInput>
          <CardFormButton
            @click="
              () =>
                setAuthentication({
                  oAuth2: {
                    ...authentication.oAuth2,
                    accessToken: '',
                    state: '',
                  },
                })
            ">
            Reset
          </CardFormButton>
        </template>
      </template>
      <!-- Password Flow -->
      <template
        v-if="
          (
            value as
              | OpenAPIV3.OAuth2SecurityScheme
              | OpenAPIV3_1.OAuth2SecurityScheme
          )?.flows?.password
        ">
        <CardFormRows>
          <CardFormGroup>
            <CardFormTextInput
              id="oAuth2.username"
              placeholder="Username"
              :value="authentication.oAuth2.username"
              @input="handleOAuth2UsernameInput">
              Username
            </CardFormTextInput>
            <CardFormTextInput
              id="oAuth2.password"
              placeholder="Password"
              type="password"
              :value="authentication.oAuth2.password"
              @input="handleOAuth2PasswordInput">
              Password
            </CardFormTextInput>
          </CardFormGroup>
          <CardFormGroup>
            <CardFormTextInput
              id="oAuth2.clientId"
              placeholder="12345"
              type="text"
              :value="authentication.oAuth2.clientId"
              @input="handleOpenAuth2ClientIdInput">
              Client ID
            </CardFormTextInput>
            <SecuritySchemeScopes
              v-if="
                value !== undefined &&
                Object.entries(
                  (
                    value as
                      | OpenAPIV3.OAuth2SecurityScheme
                      | OpenAPIV3_1.OAuth2SecurityScheme
                  )?.flows?.implicit?.scopes ??
                    (
                      value as
                        | OpenAPIV3.OAuth2SecurityScheme
                        | OpenAPIV3_1.OAuth2SecurityScheme
                    )?.flows?.password?.scopes ??
                    {},
                ).length > 0
              "
              v-model:selected="oauth2SelectedScopes"
              :scopes="
                (
                  value as
                    | OpenAPIV3.OAuth2SecurityScheme
                    | OpenAPIV3_1.OAuth2SecurityScheme
                )?.flows?.implicit?.scopes ??
                (
                  value as
                    | OpenAPIV3.OAuth2SecurityScheme
                    | OpenAPIV3_1.OAuth2SecurityScheme
                )?.flows?.password!.scopes
              " />
            <button
              class="cardform-auth-button"
              type="button"
              @click="
                () =>
                  authorizeWithPassword(
                    (
                      value as
                        | OpenAPIV3.OAuth2SecurityScheme
                        | OpenAPIV3_1.OAuth2SecurityScheme
                    ).flows?.password?.tokenUrl,
                    {
                      baseUrl: getUrlFromServerState(server),
                      proxy,
                    },
                  )
              ">
              Authorize
            </button>
          </CardFormGroup>
        </CardFormRows>
      </template>
      <!-- Other Flows -->
      <template v-else>
        <CardFormRows>
          <CardFormGroup>
            <CardFormTextInput
              id="oAuth2.clientId"
              placeholder="12345"
              type="text"
              :value="authentication.oAuth2.clientId"
              @input="handleOpenAuth2ClientIdInput">
              Client ID
            </CardFormTextInput>
            <SecuritySchemeScopes
              v-if="
                value !== undefined &&
                Object.entries(
                  (value as any).flows.implicit?.scopes ??
                    (value as any).flows.password!.scopes,
                ).length > 0
              "
              v-model:selected="oauth2SelectedScopes"
              :scopes="
                (value as any).flows.implicit?.scopes ??
                (value as any).flows.password!.scopes
              " />
            <button
              class="cardform-auth-button"
              type="button"
              @click="
                () =>
                  startAuthentication(
                    getOpenAuth2AuthorizationUrl(
                      (
                        value as
                          | OpenAPIV3.OAuth2SecurityScheme
                          | OpenAPIV3_1.OAuth2SecurityScheme
                      )?.flows?.implicit ??
                        (
                          value as
                            | OpenAPIV3.OAuth2SecurityScheme
                            | OpenAPIV3_1.OAuth2SecurityScheme
                        )?.flows?.password,
                    ),
                  )
              ">
              Authorize
            </button>
          </CardFormGroup>
        </CardFormRows>
      </template>
    </CardFormGroup>
  </CardForm>
  <!-- <CardForm v-if="value?.description">
    <div class="description">
      <MarkdownRenderer :value="value?.description" />
    </div>
  </CardForm> -->
</template>

<style scoped>
.description {
  padding: 12px 4px 4px;
  font-size: var(--scalar-mini);
}
.cardform-auth-button {
  background: var(--scalar-button-1);
  color: var(--scalar-button-1-color);
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
  border-radius: var(--scalar-radius);
  margin: 3px;
  padding: 0 9px;
  cursor: pointer;
  appearance: none;
}
.cardform-auth-button:hover {
  background: var(--scalar-button-1-hover);
}
</style>
