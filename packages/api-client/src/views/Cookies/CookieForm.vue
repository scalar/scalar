<script setup lang="ts">
import { cookieSchema, type Cookie } from '@scalar/oas-utils/entities/cookie'
import type { Path, PathValue } from '@scalar/object-utils/nested'
import { computed } from 'vue'

import Form from '@/components/Form/Form.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

const { activeCookieId } = useActiveEntities()
const { cookies, cookieMutators } = useWorkspace()

const fields = [
  { label: 'Name', key: 'name', placeholder: 'session_id' },
  { label: 'Value', key: 'value', placeholder: 'my-cookie-session-id' },
  { label: 'Domain', key: 'domain', placeholder: 'example.com' },
  // TODO: We don't check the path (yet), so we don't need to show it.
  // { label: 'Path', key: 'path', placeholder: '/' },
]

const activeCookie = computed<Cookie>(
  () =>
    cookies[activeCookieId.value] ||
    cookieSchema.parse({
      name: '',
      value: '',
      domain: '',
      path: '',
    }),
)
const updateCookie = <P extends Path<Cookie>>(
  key: P,
  value: NonNullable<PathValue<Cookie, P>>,
) => {
  cookieMutators.edit(activeCookieId.value, key, value)
}
</script>
<template>
  <Form
    :data="activeCookie"
    :onUpdate="updateCookie"
    :options="fields">
  </Form>
</template>
