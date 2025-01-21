<script setup lang="ts">
import { useActiveEntities } from '@scalar/api-client/store'
import { ServerForm } from '@scalar/api-client/views/Servers'
import { computed } from 'vue'

const { activeCollection } = useActiveEntities()

const collectionId = computed(() => activeCollection.value?.uid)
const serverUid = computed(() => activeCollection.value?.selectedServerUid)
</script>
<template>
  <ServerForm
    v-if="collectionId && serverUid"
    :collectionId="collectionId"
    :serverUid="serverUid" />
</template>
