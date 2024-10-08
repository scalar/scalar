<template>
  <h1>{{ msg }}</h1>
  <p class="import-meta-url">{{ url }}</p>
  <Button>CommonButton</Button>
</template>

<script>
import Button from '../components/button'

export default {
  components: {
    Button,
  },
  async setup() {
    const url = import.meta.env.SSR
      ? import.meta.url
      : document.querySelector('.import-meta-url')?.textContent
    return {
      msg: 'About',
      url,
    }
  },
}
</script>

<style scoped>
h1 {
  color: red;
}
</style>
