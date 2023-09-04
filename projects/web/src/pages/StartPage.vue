<template>
  <div
    class="flex flex-row gap-4 p-6 h-screen bg-gray-50 text-gray-600 items-center">
    <router-link
      class="basis-1/4 text-center border border-solid border-gray-300 hover:border-gray-400 flex flex-col justify-center rounded text-xl px-4 py-10"
      :to="{ name: 'api-reference' }">
      <h2 class="mb-4 font-bold">API Reference</h2>
      <div>Interactive API documentations</div>
    </router-link>
    <router-link
      class="basis-1/4 text-center border border-solid border-gray-300 hover:border-gray-400 flex flex-col justify-center rounded text-xl px-4 py-10"
      :to="{ name: 'standalone-api-reference' }">
      <h2 class="mb-4 font-bold">API Reference (Standalone)</h2>
      <div>Interactive API documentations</div>
    </router-link>
    <router-link
      class="basis-1/4 text-center border border-solid border-gray-300 hover:border-gray-400 flex flex-col justify-center rounded text-xl px-4 py-10"
      :to="{ name: 'api-client' }">
      <h2 class="mb-4 font-bold">API Client</h2>
      <div class="">Your drop-in API Client</div>
    </router-link>
    <router-link
      class="basis-1/4 text-center border border-solid border-gray-300 hover:border-gray-400 flex flex-col justify-center rounded text-xl px-4 py-10"
      :to="{ name: 'swagger-editor' }">
      <h2 class="mb-4 font-bold">Swagger Editor</h2>
      <div>An editor for Swagger files</div>
    </router-link>
  </div>
</template>
