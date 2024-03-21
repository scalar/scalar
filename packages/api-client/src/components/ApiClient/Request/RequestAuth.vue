<script setup lang="ts">
import { computed } from 'vue'

import { useAuthenticationStore } from '../../../stores'
import { CollapsibleSection } from '../../CollapsibleSection'

const { authentication, setAuthentication } = useAuthenticationStore()

const currentAuthenticationLabel = computed(() => {
  return authentication.preferredSecurityScheme || 'None'
})
</script>
<template>
  <CollapsibleSection title="Authentication">
    <template #options>
      <div>
        <span>
          {{ currentAuthenticationLabel }}
          <svg
            fill="none"
            height="100%"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="m19.5 10-7.5 7.5-7.5-7.5"
              xmlns="http://www.w3.org/2000/svg"></path>
          </svg>
        </span>
        <select
          @click.prevent
          @input="
            (event) =>
              setAuthentication({
                preferredSecurityScheme: (event.target as HTMLSelectElement)
                  .value,
              })
          ">
          <option value="">None</option>
          <option
            v-for="key in Object.keys(authentication.securitySchemes ?? {})"
            :key="key"
            :selected="key === authentication.preferredSecurityScheme"
            :value="key">
            {{ key }}
          </option>
        </select>
      </div>
    </template>

    <div class="preferred-security-scheme">
      {{ authentication.preferredSecurityScheme }}
    </div>
  </CollapsibleSection>
  <!-- <CollapsibleSection title="Authentication">
    <template #options>
      <div>
        <span>
          {{ authTypeFriendlyString[authState.type] }}
          <svg
            fill="none"
            height="100%"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="m19.5 10-7.5 7.5-7.5-7.5"
              xmlns="http://www.w3.org/2000/svg"></path>
          </svg>
        </span>
        <select
          v-model="authState.type"
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

    <template v-if="authState.type === 'none'">
      <div class="scalar-api-client__empty-state">No Authentication</div>
    </template>
    <template v-else>
      <div class="authentication-form">
        <template v-if="authState.type === 'basic'">
          <div class="input input__half">
            <label for="username">Username</label>
            <input
              id="username"
              v-model="authState.basic.username"
              autocomplete="off"
              placeholder="Username"
              spellcheck="false"
              type="text" />
          </div>
          <div class="input input__half">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="authState.basic.password"
              autocomplete="off"
              placeholder="Password"
              spellcheck="false"
              type="password" />
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
            <label for="username">Username</label>
            <input
              id="username"
              v-model="authState.digest.username"
              autocomplete="off"
              placeholder="Username"
              spellcheck="false"
              type="text" />
          </div>
          <div class="input input__half">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="authState.digest.password"
              autocomplete="off"
              placeholder="Password"
              spellcheck="false"
              type="password" />
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
            <label for="generatedtoken">Generated Token</label>
            <input
              id="generatedtoken"
              v-model="authState.oauthTwo.generatedToken"
              autocomplete="off"
              placeholder="Generated Token"
              spellcheck="false"
              type="text" />
          </div>
          <div class="input">
            <label for="discoveryurl">OIDC Discovery URL</label>
            <input
              id="discoveryurl"
              v-model="authState.oauthTwo.discoveryURL"
              autocomplete="off"
              placeholder="Discovery URL"
              spellcheck="false"
              type="text" />
          </div>
          <div class="input">
            <label for="authurl">Auth URL</label>
            <input
              id="authurl"
              v-model="authState.oauthTwo.authURL"
              autocomplete="off"
              placeholder="Auth URL"
              spellcheck="false"
              type="text" />
          </div>
          <div class="input">
            <label for="accesstoken">Access Token URL</label>
            <input
              id="accesstoken"
              v-model="authState.oauthTwo.accessTokenURL"
              autocomplete="off"
              placeholder="Access Token URL"
              spellcheck="false"
              type="text" />
          </div>
          <div class="input input__half">
            <label for="clientid">Client ID</label>
            <input
              id="clientid"
              v-model="authState.oauthTwo.clientID"
              autocomplete="off"
              placeholder="Client ID"
              spellcheck="false"
              type="text" />
          </div>
          <div class="input input__half">
            <label for="clientsecret">Client Secret</label>
            <input
              id="clientsecret"
              v-model="authState.oauthTwo.clientSecret"
              autocomplete="off"
              placeholder="Client Secret"
              spellcheck="false"
              type="text" />
          </div>
          <div class="input">
            <label for="scope">Scope</label>
            <input
              id="scope"
              v-model="authState.oauthTwo.scope"
              autocomplete="off"
              placeholder="Scope"
              spellcheck="false"
              type="text" />
          </div>
          <button
            class="scalar-api-client__item__content-button"
            type="button">
            <span>Generate Token</span>
          </button>
        </template>
        <template v-else-if="authState.type === 'bearer'">
          <div class="input">
            <label for="Username">Token</label>
            <input
              v-model="authState.bearer.token"
              autocomplete="off"
              placeholder="Username"
              spellcheck="false"
              type="text" />
          </div>
          <label class="check">
            <input
              v-model="authState.bearer.active"
              type="checkbox" />
            <span class="checkmark" />
            <p>Enabled</p>
          </label>
        </template>
      </div>
    </template>
  </CollapsibleSection> -->
</template>

<style scoped>
.preferred-security-scheme {
  border: 1px solid var(--default-theme-border-color);
  border-radius: var(--default-theme-radius);
  color: var(--default-theme-color-2);
  width: 100%;
  height: 3rem;
  line-height: 3rem;
  text-align: center;
}
</style>
