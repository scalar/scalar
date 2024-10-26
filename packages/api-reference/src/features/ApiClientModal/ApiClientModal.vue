<script setup lang="ts">
import { getUrlFromServerState, useServerStore } from '#legacy'
import { getBaseAuthValues } from '@scalar/oas-utils/transforms'
import type {
  ReferenceConfiguration,
  Spec,
  SpecConfiguration,
} from '@scalar/types/legacy'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useApiClient } from './useApiClient'

const props = defineProps<{
  proxyUrl?: string
  authentication?: ReferenceConfiguration['authentication']
  spec?: SpecConfiguration
  servers?: Spec['servers']
}>()

const el = ref<HTMLDivElement | null>(null)

const { server, setServer } = useServerStore()
const { client, init } = useApiClient()

onMounted(async () => {
  if (!el.value) return

  // Initialize the new client hook
  const _client = await init({
    el: el.value,
    spec: props.spec ?? {},
    authentication: props.authentication,
    proxyUrl: props.proxyUrl,
    servers: props.servers,
  })

  // Update the references server when the client server changes
  _client.onUpdateServer((url) => {
    if (!server.servers) return
    const index = server.servers.findIndex((s) => s.url === url)
    if (index >= 0) setServer({ selectedServer: index })
  })
})

// Update the server on select
watch(server, (newServer) => {
  const serverUrl = getUrlFromServerState(newServer)
  if (serverUrl && client.value) client.value.updateServer(serverUrl)
})

// Update the authentication on change
watch(
  () => props.authentication,
  (newAuth) => {
    if (!newAuth?.preferredSecurityScheme || !client.value) return

    console.log(newAuth.preferredSecurityScheme)

    const firstCollection = Object.values(client.value.store.collections)[0]
    if (!firstCollection) return

    console.log(firstCollection)

    // Select auth
    const schemeUid = firstCollection.securitySchemes.find((uid) => {
      client.value!.store.securitySchemes[uid].nameKey ===
        newAuth.preferredSecurityScheme
    })
    if (!schemeUid) return

    console.log(schemeUid)

    client.value.store.collectionMutators.edit(
      firstCollection.uid,
      'selectedSecuritySchemeUids',
      [schemeUid],
    )

    const scheme = Object.values(client.value.store.securitySchemes).find(
      ({ nameKey }) => nameKey === newAuth.preferredSecurityScheme,
    )
    if (!scheme) return

    console.log(scheme)

    const baseValues = getBaseAuthValues(scheme, newAuth)
    console.log(baseValues)
    // // Update auth properties
    // client.value.updateAuth({
    //   nameKey: newAuth.preferredSecurityScheme,
    //   propertyKey: 'username',
    //   value: newAuth.username,
    // })
  },
)

// Update the spec on change
watch(
  () => props.spec,
  (newSpec) => newSpec && client.value?.updateSpec(newSpec),
  { deep: true },
)

onBeforeUnmount(() => client.value?.app.unmount())
</script>

<template>
  <div ref="el" />
</template>
