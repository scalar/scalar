<template>
  <div class="flex flex-row gap-10 p-10 h-screen content-center bg-gray-100">
    <router-link
      :to="{ name: 'api-client' }"
      class="basis-1/2 text-center border-solid border-gray-300 hover:border-gray-400 flex flex-col justify-center rounded-lg bg-white shadow-xl text-lg p-4"
    >
      <h2 class="m-4 font-bold">
        API Client
      </h2>
      <div class="">
        Your drop-in API Client.
      </div>
    </router-link>
    <router-link
      :to="{ name: 'api-reference' }"
      class="basis-1/2 text-center border-solid border-gray-300 hover:border-gray-400 flex flex-col justify-center rounded-lg bg-white shadow-xl text-lg p-4"
    >
      <h2 class="m-4 font-bold">
        API Reference
      </h2>
      <div>
        Interactive API documentations from Swagger files.
      </div>
    </router-link>
  </div>
</template>