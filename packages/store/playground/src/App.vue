<template>
  <nav class="m-4 border p-4">
    <ul class="flex gap-4">
      <li>
        <RouterLink
          :to="{ name: 'root' }"
          class="underline">
          Root
        </RouterLink>
      </li>
      <li>
        <RouterLink
          :to="{ name: 'circular-reference' }"
          class="underline">
          Circular Reference
        </RouterLink>
      </li>
      <li>
        <RouterLink
          :to="{ name: 'dereference' }"
          class="underline">
          Dereference
        </RouterLink>
      </li>
    </ul>
  </nav>
  <main class="m-4 border p-4">
    <RouterView />
  </main>
</template>
