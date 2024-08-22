export default defineNuxtConfig({
  modules: ['../src/module'],
  scalar: {
    spec: {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    },
  },
})
