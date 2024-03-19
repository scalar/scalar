import { defineNuxtModule } from '@nuxt/kit'
import { useSSRContext } from 'vue'

/**
 * Nuxt Module for Scalar Api Reference
 *
 * Here we will parse the spec and do all calculations we need on startup
 */
export default defineNuxtModule((options, nuxt) => {
  // console.log({ nuxt, options })
  // const ctx = useSSRContext()
  // console.log({ ctx })
  // nuxt.hook('app:rendered', (x) => {
  //   console.log(x)
  // })
})
