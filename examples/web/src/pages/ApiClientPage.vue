<script setup lang="ts">
import { ApiClient, useRequestStore } from '@scalar/api-client'
import { watch } from 'vue'

const { activeRequest, setActiveRequest } = useRequestStore()

// Store active request in local storage
watch(activeRequest, () => {
  const activeRequestFromStorage = window.localStorage.getItem('activeRequest')

  if (JSON.stringify(activeRequest) !== activeRequestFromStorage) {
    window.localStorage.setItem('activeRequest', JSON.stringify(activeRequest))
  }
})

// Restore active request from local storage
const activeRequestFromStorage = window.localStorage.getItem('activeRequest')

if (activeRequestFromStorage) {
  setActiveRequest(JSON.parse(activeRequestFromStorage))
}
</script>

<template>
  <ApiClient />
</template>
