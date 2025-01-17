<script setup lang="ts">
import Form from '@/components/Form/Form.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import { computed } from 'vue'

const { activeCookieId } = useActiveEntities()
const { cookies, cookieMutators } = useWorkspace()

const fields = [
  { label: 'Name', key: 'name', placeholder: 'session_id' },
  { label: 'Value', key: 'value', placeholder: 'my-cookie-session-id' },
  { label: 'Domain', key: 'domain', placeholder: 'example.com' },
  { label: 'Path', key: 'path', placeholder: '/' },
  {
    label: 'Expires',
    key: 'expires',
    placeholder: new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString(),
  },
  {
    label: 'Secure',
    key: 'secure',
    placeholder: 'True/False',
    type: 'boolean',
  },
  {
    label: 'HttpOnly',
    key: 'httpOnly',
    placeholder: 'True/False',
    type: 'boolean',
  },
]

const activeCookie = computed<Cookie>(
  () =>
    cookies[activeCookieId.value as string] || {
      value: '',
      uid: '',
      name: '',
      sameSite: 'Lax' as const,
    },
)
const updateCookie = (key: any, value: any) => {
  if (activeCookieId.value) {
    cookieMutators.edit(activeCookieId.value, key, value)
  }
}
</script>
<template>
  <Form
    :data="activeCookie"
    :onUpdate="updateCookie"
    :options="fields">
    <template #title>
      <div class="flex items-center pointer-events-none">
        <label
          class="absolute border-b w-full h-full top-0 left-0 pointer-events-auto opacity-0 cursor-text"
          for="cookiename"></label>
        <input
          id="cookiename"
          class="md:pl-1 outline-none border-0 text-c-2 rounded pointer-events-auto relative w-full"
          placeholder="Cookie Name"
          :value="activeCookie.name"
          @input="
            (event) =>
              updateCookie('name', (event.target as HTMLInputElement).value)
          " />
      </div>
    </template>
  </Form>
</template>
