<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components'

import { useGlobalStore } from '../../../stores'
import CardForm from './CardForm.vue'
import CardFormButton from './CardFormButton.vue'
import CardFormGroup from './CardFormGroup.vue'
import CardFormTextInput from './CardFormTextInput.vue'
import SecuritySchemeScopes from './SecuritySchemeScopes.vue'

// import MarkdownRenderer from '../MarkdownRenderer.vue'

defineProps<{
  value?: any
}>()

const { authentication, setAuthentication } = useGlobalStore()

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

const handleScopeInput = (scope: string) => {
  setAuthentication({
    oAuth2: {
      ...authentication.oAuth2,
      scopes: {
        ...authentication.oAuth2.scopes,
        [scope]: !authentication.oAuth2.scopes[scope],
      },
    },
  })
}

const getOpenAuth2AuthorizationUrl = (flow: any) => {
  // https://example.com/oauth/authorize?
  //   response_type=token
  //   &client_id=123
  //   &redirect_uri=https%3A%2F%2Fexample.com%2Foauth2%2Fredirect
  //   &scope=write%3Apets%20read%3Apets
  //   &state=something-random

  const scopes = Object.keys(flow.scopes)
    .filter((scope) => authentication.oAuth2.scopes[scope])
    .join(' ')

  const url = new URL(flow.authorizationUrl)

  url.searchParams.set('response_type', 'token')
  url.searchParams.set('client_id', authentication.oAuth2.clientId)
  url.searchParams.set('redirect_uri', window.location.href)
  url.searchParams.set('scope', scopes)
  // TODO: Generate random state string? Should we store that in the localStorage? 🤔
  url.searchParams.set('state', 'something-random')

  return url.toString()
}

const startAuthentication = (url: string) => {
  const windowFeatures = 'left=100,top=100,width=800,height=600'
  const handle = window.open(url, 'openAuth2Window', windowFeatures)

  if (!handle) {
    // The window wasn't allowed to open
    // This is likely caused by built-in popup blockers.
    // …
  }
}
</script>
<template>
  <CardForm v-if="value && value?.type">
    <CardFormTextInput
      v-if="value.type === 'apiKey'"
      :id="`security-scheme-${value.name}`"
      placeholder="Token"
      :value="authentication.apiKey.token"
      @input="handleApiKeyTokenInput">
      {{ value.in.charAt(0).toUpperCase() + value.in.slice(1) }} API Key
    </CardFormTextInput>
    <template v-else-if="value.type === 'http' || value.type === 'basic'">
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
        v-else-if="value.scheme === 'bearer'"
        id="http.bearer.token"
        placeholder="Token"
        :value="authentication.http.bearer.token"
        @input="handleHttpBearerTokenInput">
        Bearer Token
      </CardFormTextInput>
    </template>
    <CardFormGroup
      v-else-if="
        value.type.toLowerCase() === 'oauth2' &&
        value.flows &&
        value.flows.implicit
      ">
      <CardFormTextInput
        id="oAuth2.clientId"
        placeholder="Token"
        :value="authentication.oAuth2.clientId"
        @input="handleOpenAuth2ClientIdInput">
        Client ID
      </CardFormTextInput>
      <SecuritySchemeScopes :scopes="value.flows.implicit.scopes" />
      <CardFormButton
        @click="
          () =>
            startAuthentication(
              getOpenAuth2AuthorizationUrl(value.flows.implicit),
            )
        ">
        Authorize
      </CardFormButton>
    </CardFormGroup>
  </CardForm>
</template>
