<script setup lang="ts">
import { watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { PathId } from '@/router'
import { useActiveEntities } from '@/store'
import CollectionNavigation from '@/views/Collection/CollectionNavigation.vue'

const { activeCollection } = useActiveEntities()
const router = useRouter()

// If collection is called 'Drafts', redirect to the first request
watch(
  activeCollection,
  (collection) => {
    if (collection?.info?.title === 'Drafts') {
      const firstRequest = collection.requests[0]
      router.push({
        name: 'request',
        params: { [PathId.Request]: firstRequest },
      })
    }
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <ViewLayout class="flex divide-y md:flex-col">
    <CollectionNavigation />
    <ViewLayoutContent class="flex-1">
      <RouterView />
    </ViewLayoutContent>
  </ViewLayout>
</template>
