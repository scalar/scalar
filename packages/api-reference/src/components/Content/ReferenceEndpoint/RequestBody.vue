<script setup lang="ts">
import type { RequestBody } from '../../../types'
import RequestBodyProperties from './RequestBodyProperties.vue'

defineProps<{ requestBody?: RequestBody }>()
</script>
<template>
  <div
    v-if="requestBody"
    class="body-container">
    <div class="endpoint-title">
      <h5 class="title">Body</h5>
    </div>
    <ul
      v-if="requestBody.content['application/json']"
      class="parameter">
      <RequestBodyProperties
        :contentProperties="
          requestBody.content['application/json'].schema.properties || {}
        "
        :required="
          requestBody.content['application/json'].schema.required || []
        " />
    </ul>
  </div>
</template>
