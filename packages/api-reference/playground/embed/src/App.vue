<script setup lang="ts">
import { ScalarCodeBlock } from '@scalar/components'

import '../../../dist/style.css'
import {
  ExampleRequest,
  ExampleResponses,
  OpenApiDocument,
} from '../../../src/embeds/index'

const sourcecode = `<OpenApiDocument
  v-slot="{ configuration, parsedSpec }"
  :configuration="{
    proxy: 'https://proxy.scalar.com',
    spec: {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    }
  }">

  <!-- Example Request -->
  <ExampleRequest
    :configuration="configuration"
    :operation="parsedSpec.tags?.[1]?.operations?.[1]"
    :parsedSpec="parsedSpec" />

  <!-- Example Responses -->
  <ExampleResponses :operation="parsedSpec.tags?.[1]?.operations?.[1]" />

</OpenApiDocument>`
</script>

<template>
  <div class="embeds">
    <h1>Usage</h1>
    <div class="embed">
      <div class="scalar-app">
        <ScalarCodeBlock
          :content="sourcecode"
          lang="js" />
      </div>
    </div>

    <OpenApiDocument
      v-slot="{ configuration, parsedSpec }"
      :configuration="{
        proxy: 'https://proxy.scalar.com',
        hiddenClients: ['guzzle'],
        defaultHttpClient: {
          targetKey: 'node',
          clientKey: 'fetch',
        },
        // baseServerURL: 'https://api.scalar.com',
        // servers: [
        //   {
        //     url: 'https://api.scalar.com',
        //     description: 'Scalar API',
        //   },
        // ],
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
      }">
      <div class="embed">
        <h2>ExampleRequest</h2>
        <ExampleRequest
          :configuration="configuration"
          :operation="parsedSpec.tags?.[1]?.operations?.[1]"
          :parsedSpec="parsedSpec" />
      </div>
      <div class="embed">
        <h2>ExampleResponses</h2>
        <ExampleResponses :operation="parsedSpec.tags?.[1]?.operations?.[1]" />
      </div>
    </OpenApiDocument>
  </div>
</template>

<style scoped>
.embeds {
  margin: 1.5rem;
}

.embed {
  margin: 1rem 0 3rem;
}

h1,
h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  font-family: sans-serif;
}
</style>
