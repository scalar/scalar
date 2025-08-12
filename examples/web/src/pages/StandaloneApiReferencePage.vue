<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'

const configuration: AnyApiReferenceConfiguration = {
  sources: [
    {
      title: 'Scalar Galaxy',
      slug: 'scalar-galaxy',
      url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
    },
    {
      title: 'Scalar Galaxy (Classic Layout)',
      url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
      // @ts-expect-error TODO: types are wrong here
      layout: 'classic',
    },
    {
      title: 'Scalar Galaxy (Path Routing)',
      url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
      pathRouting: { basePath: '/path-routing' },
    },
    {
      title: 'Relative URL Example',
      slug: 'relative-url',
      url: 'examples/openapi.json',
    },
    {
      title: 'Swagger Petstore 2.0',
      url: 'https://petstore.swagger.io/v2/swagger.json',
    },
    {
      title: 'Swagger Petstore 3.0',
      url: 'https://petstore3.swagger.io/api/v3/openapi.json',
    },
    {
      title: 'Swagger Petstore 3.1',
      url: 'https://petstore31.swagger.io/api/v31/openapi.json',
    },
    {
      title: 'Hello World (string)',
      content: JSON.stringify({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {
          '/hello': {
            get: {
              summary: 'Hello World',
              description: 'Hello World',
              responses: {
                200: {
                  description: 'Hello World',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    },
    {
      title: 'Valtown',
      url: 'https://docs.val.town/openapi.documented.json',
    },
    {
      title: 'Zoom',
      url: 'https://developers.zoom.us/api-hub/meetings/methods/endpoints.json',
    },
    {
      title: 'Cloudinary',
      url: 'https://cloudinary.com/documentation/schemas/analysis-api/public-schema.yml',
    },
    {
      title: 'Tailscale',
      url: 'https://api.tailscale.com/api/v2?outputOpenapiSchema=true',
    },
    {
      title: 'Maersk',
      url: 'https://edpmediastorage.blob.core.windows.net/media/air_booking_v1-0_26092023_scalar_spec.yaml',
    },
    {
      title: 'Bolt',
      url: 'https://assets.bolt.com/external-api-references/bolt.yml',
    },
    {
      title: 'OpenStatus',
      url: 'https://api.openstatus.dev/v1/openapi',
    },
  ],
  persistAuth: true,
  // Avoid CORS issues
  proxyUrl: import.meta.env.VITE_REQUEST_PROXY_URL,
}
</script>
<template>
  <ApiReference :configuration="configuration" />
</template>
