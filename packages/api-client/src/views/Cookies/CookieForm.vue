<script setup lang="ts">
import Form from '@/components/Form/Form.vue'
import { useWorkspace } from '@/store'
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
    :options="options">
    <template #title>
      <div class="flex items-center pointer-events-none">
        <label
          class="absolute w-full h-full top-0 left-0 pointer-events-auto opacity-0 cursor-text"
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
