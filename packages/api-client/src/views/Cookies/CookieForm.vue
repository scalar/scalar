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
  // TODO: We don’t check the path (yet), so we don’t need to show it.
  // { label: 'Path', key: 'path', placeholder: '/' },
]

const activeCookie = computed<Cookie>(
  () =>
    cookies[activeCookieId.value as string] || {
      uid: '',
      name: '',
      value: '',
      domain: '',
      path: '',
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
      <span class="text-c-2">Edit Cookie</span>
    </template>
  </Form>
</template>
