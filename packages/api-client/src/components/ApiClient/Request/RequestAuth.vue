<script setup lang="ts">
import { tokenRequestUrl } from '../../../helpers'
import { useApiClientRequestStore } from '../../../stores/apiClientRequestStore'
import { CollapsibleSection } from '../../CollapsibleSection'

const { activeRequest } = useApiClientRequestStore()

const authTypeFriendlyString: { [key: string]: string } = {
  basic: 'Basic Auth',
  digest: 'Digest Auth',
  oauthOne: 'OAuth 1.0',
  oauthTwo: 'OAuth 2.0',
  bearer: 'Bearer Token',
  none: 'None',
}

const authDropdownItems = [
  {
    text: 'Basic Auth',
    type: 'basic',
    disabled: false,
  },
  {
    text: 'Digest Auth',
    type: 'digest',
    disabled: true,
  },
  {
    text: 'OAuth',
    type: 'oauthOne',
    disabled: true,
  },
  {
    text: 'OAuth 2.0',
    type: 'oauthTwo',
    disabled: false,
  },
  {
    text: 'Bearer Token',
    type: 'bearer',
    disabled: false,
  },
  {
    text: 'None',
    type: 'none',
    disabled: false,
  },
]

const generateOauthTwoToken = async () => {
  const url = await tokenRequestUrl({
    oidcDiscoveryUrl: activeRequest.authentication.oauthTwo.discoveryURL,
    grantType: 'code',
    authUrl: activeRequest.authentication.oauthTwo.authURL,
    accessTokenUrl: activeRequest.authentication.oauthTwo.accessTokenURL,
    clientId: activeRequest.authentication.oauthTwo.clientID,
    clientSecret: activeRequest.authentication.oauthTwo.clientSecret,
    scope: activeRequest.authentication.oauthTwo.scope,
  })

  console.log('[generateOauthTwoToken]', url)
}
</script>
<template>
  <CollapsibleSection title="Authentication">
    <template #options>
      <div>
        <span>
          {{ authTypeFriendlyString[activeRequest.authentication.type] }}
          <svg
            height="18"
            viewBox="0 0 10 18"
            width="10"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 2.83L8.17 6l1.41-1.41L5 0 .41 4.59 1.83 6 5 2.83zm0 12.34L1.83 12 .42 13.41 5 18l4.59-4.59L8.17 12 5 15.17z"
              fill="currentColor"
              fill-rule="nonzero" />
          </svg>
        </span>
        <select
          v-model="activeRequest.authentication.type"
          @click.prevent>
          <option
            v-for="option in authDropdownItems"
            :key="option.type"
            :disabled="option.disabled"
            :value="option.type">
            {{ option.text }}
          </option>
        </select>
      </div>
    </template>

    <template v-if="activeRequest.authentication.type === 'none'">
      <div class="scalar-api-client__empty-state">No Authentication</div>
    </template>
    <template v-else>
      <template v-if="activeRequest.authentication.type === 'basic'">
        <div class="input input__half">
          <input
            v-model="activeRequest.authentication.basic.username"
            autocomplete="off"
            placeholder="Username"
            spellcheck="false"
            type="text" />
          <label for="Username">Username</label>
        </div>
        <div class="input input__half">
          <input
            v-model="activeRequest.authentication.basic.password"
            autocomplete="off"
            placeholder="Username"
            spellcheck="false"
            type="password" />
          <label for="Password">Password</label>
        </div>
        <label class="check">
          <input
            v-model="activeRequest.authentication.basic.active"
            type="checkbox" />
          <span class="checkmark" />
          <p>Enabled</p>
        </label>
      </template>
      <template v-else-if="activeRequest.authentication.type === 'digest'">
        <div class="input input__half">
          <input
            v-model="activeRequest.authentication.digest.username"
            autocomplete="off"
            placeholder="Username"
            spellcheck="false"
            type="text" />
          <label for="Username">Username</label>
        </div>
        <div class="input input__half">
          <input
            v-model="activeRequest.authentication.digest.password"
            autocomplete="off"
            placeholder="Password"
            spellcheck="false"
            type="password" />
          <label for="Password">Password</label>
        </div>
        <label class="check">
          <input
            v-model="activeRequest.authentication.digest.active"
            type="checkbox" />
          <span class="checkmark" />
          <p>Enabled</p>
        </label>
      </template>
      <template v-else-if="activeRequest.authentication.type === 'oauthTwo'">
        <div class="input">
          <input
            v-model="activeRequest.authentication.oauthTwo.generatedToken"
            autocomplete="off"
            placeholder="Token"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">Token</label>
        </div>
        <div class="input">
          <input
            v-model="activeRequest.authentication.oauthTwo.discoveryURL"
            autocomplete="off"
            placeholder="https://example.com/.well-known/openid-configuration"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">OpenID Connect Discovery URL</label>
        </div>
        <div class="input">
          <input
            v-model="activeRequest.authentication.oauthTwo.authURL"
            autocomplete="off"
            placeholder="https://example.com/oauth2/authorize"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">Authorization URL</label>
        </div>
        <div class="input">
          <input
            v-model="activeRequest.authentication.oauthTwo.accessTokenURL"
            autocomplete="off"
            placeholder="https://example.com/oauth2/token"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">Access Token URL</label>
        </div>
        <div class="input input__half">
          <input
            v-model="activeRequest.authentication.oauthTwo.clientID"
            autocomplete="off"
            placeholder="123"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">Client ID</label>
        </div>
        <div class="input input__half">
          <input
            v-model="activeRequest.authentication.oauthTwo.clientSecret"
            autocomplete="off"
            placeholder="secret"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">Client Secret</label>
        </div>
        <div class="input">
          <input
            v-model="activeRequest.authentication.oauthTwo.scope"
            autocomplete="off"
            placeholder="profile"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">Scope</label>
        </div>
        <button
          class="scalar-api-client__item__content-button"
          type="button"
          @click="generateOauthTwoToken">
          Generate Token
        </button>
      </template>
      <template v-else-if="activeRequest.authentication.type === 'bearer'">
        <div class="input">
          <input
            v-model="activeRequest.authentication.bearer.token"
            autocomplete="off"
            placeholder="Username"
            spellcheck="false"
            type="text" />
          <label for="Username">Token</label>
        </div>
        <label class="check">
          <input
            v-model="activeRequest.authentication.bearer.active"
            type="checkbox" />
          <span class="checkmark" />
          <p>Enabled</p>
        </label>
      </template>
    </template>
  </CollapsibleSection>
</template>
