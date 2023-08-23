<template>
  <div
    class="flex flex-row gap-4 p-6 h-screen bg-gray-50 text-gray-600 items-center"
  >
    <router-link
      :to="{ name: 'api-client' }"
      class="basis-1/3 text-center border-solid border-gray-300 hover:border-gray-400 flex flex-col justify-center rounded text-xl p-10"
    >
      <h2 class="mb-4 font-bold">
        API Client
      </h2>
      <div class="">
        Your drop-in API Client
      </div>
    </router-link>
    <router-link
      :to="{ name: 'api-reference' }"
      class="basis-1/3 text-center border-solid border-gray-300 hover:border-gray-400 flex flex-col justify-center rounded text-xl p-10"
    >
      <h2 class="mb-4 font-bold">
        API Reference
      </h2>
      <div>Interactive API documentations</div>
    </router-link>
    <router-link
      :to="{ name: 'swagger-editor' }"
      class="basis-1/3 text-center border-solid border-gray-300 hover:border-gray-400 flex flex-col justify-center rounded text-xl p-10"
    >
      <h2 class="mb-4 font-bold">
        Swagger Editor
      </h2>
      <div>An editor for Swagger files</div>
    </router-link>
  </div>
</template>
