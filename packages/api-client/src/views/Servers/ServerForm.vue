<script setup lang="ts">
import Form from '@/components/Form/Form.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import type { Server } from '@scalar/oas-utils/entities/spec'
import { computed, withDefaults } from 'vue'

const props = withDefaults(
  defineProps<{
    collectionId: string | string[]
    serverUid: string | string[]
  }>(),
  {
    collectionId: '',
    serverUid: '',
  },
)

const { activeWorkspaceCollections } = useActiveEntities()
const { servers, serverMutators } = useWorkspace()

const options = [
  { label: 'URL', key: 'url', placeholder: 'https://void.scalar.com/api' },
  {
    label: 'Label',
    key: 'description',
    placeholder: 'Production',
  },
]

const activeServer = computed(() => {
  const activeCollection = activeWorkspaceCollections.value.find(
    (collection) => collection.uid === props.collectionId,
  )
  return servers[
    activeCollection &&
    typeof props.serverUid === 'string' &&
    props.serverUid === 'default'
      ? (activeCollection.servers[0] ?? '')
      : (activeCollection?.servers.find((uid) => uid === props.serverUid) ?? '')
  ]
})

const updateServer = (key: string, value: string) => {
  if (!activeWorkspaceCollections.value || !activeServer.value) return
  serverMutators.edit(activeServer.value.uid, key as keyof Server, value)
}
</script>
<template>
  <div class="divide-0.5 divide-x flex w-full">
    <template v-if="activeServer">
      <Form
        :data="activeServer"
        :onUpdate="updateServer"
        :options="options"
        title="Server" />
    </template>
  </div>
</template>
