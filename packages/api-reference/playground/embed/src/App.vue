<script setup lang="ts">
import { ScalarCodeBlock } from '@scalar/components'

import '../../../dist/style.css'
import { ExampleRequest, OpenApiDocument } from '../../../src/embeds/index'

const sourcecode = `<OpenApiDocument
  v-slot="{ configuration, parsedSpec }"
  :configuration="{
    proxy: 'https://proxy.scalar.com',
    spec: {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    }
  }">

  <ExampleRequest
    :configuration="configuration"
    :operation="parsedSpec.tags?.[1]?.operations?.[1]"
    :parsedSpec="parsedSpec" />

</OpenApiDocument>`
</script>

<template>
  <div class="embeds">
    <h1>Example Request Embed</h1>
    <div class="scalar-app">
      <ScalarCodeBlock
        :content="sourcecode"
        lang="js" />
    </div>

    <h2>Preview</h2>
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
        <ExampleRequest
          :configuration="configuration"
          :operation="parsedSpec.tags?.[1]?.operations?.[1]"
          :parsedSpec="parsedSpec" />
      </div>
    </OpenApiDocument>
  </div>
</template>

<style scoped>
.embeds {
  margin: 1.5rem;
}
h1,
h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  font-family: sans-serif;
}
.embed {
  margin: 1rem 0;
}
</style>
