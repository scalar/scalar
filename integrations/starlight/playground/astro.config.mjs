// @ts-check
import starlight from '@astrojs/starlight'
import { scalarStarlight } from '@scalar/starlight'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Scalar + Starlight',
      description: 'A demo docs site using the @scalar/starlight plugin.',
      // Your own docs. The plugin appends an "API Reference" entry below this.
      sidebar: [{ label: 'Guides', autogenerate: { directory: 'guides' } }],
      plugins: [
        scalarStarlight({
          configuration: {
            url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
          },
        }),
      ],
    }),
  ],
})
