<script setup lang="ts">
import Form from '@/components/Form/Form.vue'
import { useWorkspace } from '@/store/workspace'
import { computed } from 'vue'

const { cookies, activeCookieId, cookieMutators } = useWorkspace()

const options = [
  { label: 'Key', key: 'key', placeholder: 'Username' },
  { label: 'Value', key: 'value', placeholder: '123' },
  { label: 'Domain', key: 'domain', placeholder: 'scalar.com' },
  { label: 'Path', key: 'path', placeholder: '/' },
  { label: 'Expires', key: 'expires', placeholder: 'Tomorrow' },
  { label: 'Secure', key: 'secure', placeholder: 'True/False' },
  { label: 'HttpOnly', key: 'httpOnly', placeholder: 'True/False' },
]

const activeCookie = computed(
  () => cookies[activeCookieId.value as string] || {},
)
const updateCookie = (key: any, value: any) => {
  if (activeCookieId.value) {
    cookieMutators.edit(activeCookieId.value as string, key, value)
  }
}
</script>
<template>
  <Form
    :data="activeCookie"
    :onUpdate="updateCookie"
    :options="options"
    title="Cookie" />
</template>
