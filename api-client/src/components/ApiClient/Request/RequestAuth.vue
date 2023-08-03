<script setup lang="ts">
import { ref } from 'vue'

import { useApiClientRequestStore } from '../../../stores/apiClientRequestStore'
import { CollapsibleSection } from '../../CollapsibleSection'

const store = useApiClientRequestStore()

const { authState } = store

const show = ref(true)

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
  },
  {
    text: 'OAuth 2.0',
    type: 'oauthTwo',
  },
  {
    text: 'Bearer Token',
    type: 'bearer',
  },
  {
    text: 'None',
    type: 'none',
  },
]
</script>
<template>
  <CollapsibleSection title="Authentication">
    <template #options>
      <div>
        <span>
          {{ authTypeFriendlyString[authState.type] }}
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
          v-show="show"
          v-model="authState.type"
          @click.prevent>
          <option
            v-for="option in authDropdownItems"
            :key="option.type"
            :value="option.type">
            {{ option.text }}
          </option>
        </select>
      </div>
    </template>

    <template v-if="authState.type === 'none'">
      <div class="scalar-api-client__empty-state">No Authentication</div>
    </template>
    <template v-else>
      <template v-if="authState.type === 'basic'">
        <div class="input input__half">
          <input
            v-model="authState.basic.userName"
            autocomplete="off"
            placeholder="Username"
            spellcheck="false"
            type="text" />
          <label for="Username">Username</label>
        </div>
        <div class="input input__half">
          <input
            v-model="authState.basic.password"
            autocomplete="off"
            placeholder="Username"
            spellcheck="false"
            type="password" />
          <label for="Password">Password</label>
        </div>
        <label class="check">
          <input
            v-model="authState.basic.active"
            type="checkbox" />
          <span class="checkmark" />
          <p>Enabled</p>
        </label>
      </template>
      <template v-else-if="authState.type === 'digest'">
        <div class="input input__half">
          <input
            v-model="authState.digest.userName"
            autocomplete="off"
            placeholder="Username"
            spellcheck="false"
            type="text" />
          <label for="Username">Username</label>
        </div>
        <div class="input input__half">
          <input
            v-model="authState.digest.password"
            autocomplete="off"
            placeholder="Password"
            spellcheck="false"
            type="password" />
          <label for="Password">Password</label>
        </div>
        <label class="check">
          <input
            v-model="authState.digest.active"
            type="checkbox" />
          <span class="checkmark" />
          <p>Enabled</p>
        </label>
      </template>
      <template v-else-if="authState.type === 'oauthTwo'">
        <div class="input">
          <input
            v-model="authState.oauthTwo.generatedToken"
            autocomplete="off"
            placeholder="Generated Token"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">Generated Token</label>
        </div>
        <div class="input">
          <input
            v-model="authState.oauthTwo.discoveryURL"
            autocomplete="off"
            placeholder="Discovery URL"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">OIDC Discovery URL</label>
        </div>
        <div class="input">
          <input
            v-model="authState.oauthTwo.authURL"
            autocomplete="off"
            placeholder="Auth URL"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">Auth URL</label>
        </div>
        <div class="input">
          <input
            v-model="authState.oauthTwo.accessTokenURL"
            autocomplete="off"
            placeholder="Access Token URL"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">Access Token URL</label>
        </div>
        <div class="input input__half">
          <input
            v-model="authState.oauthTwo.clientID"
            autocomplete="off"
            placeholder="Client ID"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">Client ID</label>
        </div>
        <div class="input input__half">
          <input
            v-model="authState.oauthTwo.clientSecret"
            autocomplete="off"
            placeholder="Client Secret"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">Client Secret</label>
        </div>
        <div class="input">
          <input
            v-model="authState.oauthTwo.scope"
            autocomplete="off"
            placeholder="Scope"
            spellcheck="false"
            type="text" />
          <label for="Consumer Key">Scope</label>
        </div>
        <!--  @click="generateOauthTwoToken" -->
        <button
          class="scalar-api-client__item__content-button"
          type="button">
          Generate Token
        </button>
      </template>
      <template v-else-if="authState.type === 'bearer'">
        <div class="input">
          <input
            v-model="authState.bearer.token"
            autocomplete="off"
            placeholder="Username"
            spellcheck="false"
            type="text" />
          <label for="Username">Token</label>
        </div>
        <label class="check">
          <input
            v-model="authState.bearer.active"
            type="checkbox" />
          <span class="checkmark" />
          <p>Enabled</p>
        </label>
      </template>
    </template>
  </CollapsibleSection>
</template>
