<template>
  <nav class="m-4 border p-4">
    <ul class="flex gap-4">
      <li>
        <RouterLink
          :to="{ name: 'dereference' }"
          class="underline">
          Dereference
        </RouterLink>
      </li>
      <li>
        <RouterLink
          :to="{ name: 'create-collection' }"
          class="underline">
          Create Collection
        </RouterLink>
      </li>
      <li>
        <RouterLink
          :to="{ name: 'external-references' }"
          class="underline">
          External References
        </RouterLink>
      </li>
      <li>
        <RouterLink
          :to="{ name: 'circular-reference' }"
          class="underline">
          Circular Reference
        </RouterLink>
      </li>
    </ul>
  </nav>
  <main class="m-4 border p-4">
    <RouterView />
  </main>
</template>
