<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import { ref } from 'vue'

const specRef = ref<string>('')

;(() => {
  // const specUrlElement = document.querySelector('div[data-spec-url]')

  // if (!specUrlElement) {
  //   console.error(
  //     'Could not find an element providing an OpenAPI/Swagger spec URL. Try adding it like this: %c<div data-spec-url="https://scalar.com/swagger.json"></div>',
  //     'font-family: monospace;',
  //   )

  //   return
  // }

  const specUrl = '/scalar.json'

  // console.info(
  //   'Found an element providing an OpenAPI/Swagger spec URL:',
  //   specUrl,
  // )

  if (specUrl === null || specUrl.length === 0) {
    console.error(
      'This doesn’t seem to be a valid OpenAPI/Swagger spec URL:',
      specUrl,
    )

    return
  }

  fetch(specUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error('The provided OpenAPI/Swagger spec URL is invalid.')
      }

      return response.text()
    })
    .then((data) => {
      specRef.value = data
    })
    .catch((error) => {
      console.log(
        'Could not fetch the OpenAPI/Swagger Spec file:',
        error.message,
      )
    })
})()
</script>

<template>
  <!-- <ApiReference
    :is-editable="true"
    :spec="specRef" /> -->
  <ApiReference
    :is-editable="false"
    :spec="specRef" />
</template>
