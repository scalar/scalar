<script setup lang="ts">
import type { ThemeId } from '@scalar/types'
import type { ApiReferenceConfigurationWithSources } from '@scalar/types/api-reference'

defineProps<{
  modelValue: Partial<ApiReferenceConfigurationWithSources>
}>()

defineEmits<{
  (
    e: 'update:modelValue',
    value: Partial<ApiReferenceConfigurationWithSources>,
  ): void
}>()

const sources = [
  {
    title: 'Scalar Galaxy',
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
  {
    title: 'Scalar Galaxy (YAML)',
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
  },
  {
    title: 'Stripe',
    url: 'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.yaml',
  },
  {
    title: 'Swagger Petstore (2.0)',
    url: 'https://petstore.swagger.io/v2/swagger.json',
  },
  {
    title: 'Swagger Petstore (3.0)',
    url: 'https://petstore3.swagger.io/api/v3/openapi.json',
  },
  {
    title: 'Swagger Petstore (3.1)',
    url: 'https://petstore31.swagger.io/api/v31/openapi.json',
  },
  {
    title: 'Val Town',
    url: 'https://docs.val.town/openapi.documented.json',
  },
  {
    title: 'Outline',
    url: 'https://raw.githubusercontent.com/outline/openapi/refs/heads/main/spec3.yml',
  },
  {
    title: 'Sentry',
    url: 'https://raw.githubusercontent.com/getsentry/sentry/refs/heads/master/api-docs/openapi.json',
  },
  {
    title: 'Vercel',
    url: 'https://openapi.vercel.sh/',
  },
  {
    title: 'Specification Extensions',
    content: JSON.stringify({
      'x-custom-extension': 'root.x-custom-extension',
      'openapi': '3.1.0',
      'info': {
        'title': 'Specification Extensions',
        'description':
          'An OpenAPI document with specification extensions where the specification allows them.',
        'version': '1.0.0',
        'x-custom-extension': 'info.x-custom-extension',
        'contact': {
          'name': 'API Support',
          'url': 'https://www.example.com/support',
          'email': 'support@example.com',
          'x-custom-extension': 'info.contact.x-custom-extension',
        },
        'license': {
          'name': 'Apache 2.0',
          'url': 'https://www.apache.org/licenses/LICENSE-2.0.html',
          'x-custom-extension': 'info.license.x-custom-extension',
        },
      },
      'tags': [
        {
          'name': 'Foobar',
          'x-custom-extension': 'tags.Foobar.x-custom-extension',
        },
      ],
      'externalDocumentation': {
        'url': 'https://www.example.com/docs',
        'x-custom-extension': 'externalDocumentation.x-custom-extension',
      },
      'servers': [
        {
          'url': 'https://example.com/{version}',
          'x-custom-extension': 'servers.x-custom-extension',
          'variables': {
            version: {
              'default': 'v1',
              'x-custom-extension':
                'servers.variables.version.x-custom-extension',
            },
          },
        },
      ],
      'paths': {
        '/': {
          'x-custom-extension': 'paths./.x-custom-extension',
          'post': {
            'tags': ['Foobar'],
            'operationId': 'foobar',
            'summary': 'Get a list of all foobars',
            'x-custom-extension': 'paths./.get.x-custom-extension',
            'parameters': [
              {
                'name': 'limit',
                'type': 'integer',
                'in': 'query',
                'x-custom-extension':
                  'paths./.get.parameters.limit.x-custom-extension',
              },
            ],
            'requestBody': {
              'x-custom-extension':
                'paths./.get.requestBody.x-custom-extension',
              'content': {
                'application/x-www-form-urlencoded': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                      },
                      icon: {
                        type: 'string',
                        contentEncoding: 'base64url',
                      },
                      petType: {
                        type: 'string',
                        description: 'Type of pet',
                        enum: ['dog', 'cat'],
                      },
                    },
                    discriminator: {
                      'propertyName': 'petType',
                      'mapping': {
                        dog: '#/components/schemas/Dog',
                        cat: '#/components/schemas/Cat',
                      },
                      'x-custom-extension':
                        'paths./.get.requestBody.content.application/x-www-form-urlencoded.schema.discriminator.x-custom-extension',
                    },
                  },
                },
                'examples': {
                  foo: {
                    'x-custom-extension':
                      'paths./.get.requestBody.examples.foo.x-custom-extension',
                    'summary': 'A foo example',
                    'value': {
                      foo: 'bar',
                    },
                  },
                },
              },
              'encoding': {
                icon: {
                  'x-custom-extension':
                    'paths./.get.requestBody.encoding.icon.x-custom-extension',
                  'contentType': 'image/png, image/jpeg',
                },
              },
            },
            'responses': {
              'x-custom-extension': 'paths./.get.responses.x-custom-extension',
              '200': {
                'x-custom-extension':
                  'paths./.get.responses.200.x-custom-extension',
                'headers': {
                  'X-Rate-Limit-Limit': {
                    'x-custom-extension':
                      'paths./.get.responses.200.headers.X-Rate-Limit-Limit.x-custom-extension',
                    'description':
                      'The number of allowed requests in the current period',
                    'schema': {
                      type: 'integer',
                    },
                  },
                },
                'description': 'A list of foobars',
                'content': {
                  'application/json': {
                    schema: {
                      type: 'object',
                    },
                  },
                },
                'links': {
                  address: {
                    'x-custom-extension':
                      'paths./.get.responses.200.links.address.x-custom-extension',
                    'operationId': 'getUserAddress',
                    'parameters': {
                      userid: '$request.path.id',
                    },
                  },
                },
              },
            },
            'callbacks': {
              myCallback: {
                'x-custom-extension':
                  'paths./.get.callbacks.myCallback.x-custom-extension',
                'summary': 'Get a list of all foobars',
                'description': 'Callback triggered when operation completes',
                '{$request.query.queryUrl}': {
                  post: {
                    requestBody: {
                      description: 'Callback payload',
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: {
                              timestamp: {
                                type: 'string',
                                format: 'date-time',
                              },
                              data: {
                                type: 'array',
                                items: {
                                  $ref: '#/components/schemas/Foobar',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      'components': {
        'securitySchemes': {
          apiKey: {
            'type': 'apiKey',
            'name': 'apiKey',
            'x-custom-extension':
              'components.securitySchemes.apiKey.x-custom-extension',
          },
          oAuth2: {
            type: 'oauth2',
            flows: {
              clientCredentials: {
                'tokenUrl': 'https://example.com/oauth/token',
                'scopes': {
                  'read:foobars': 'Read access to foobars',
                  'write:foobars': 'Write access to foobars',
                },
                'x-custom-extension':
                  'components.securitySchemes.oAuth2.flows.clientCredentials.x-custom-extension',
              },
            },
          },
        },
        'schemas': {
          Foobar: {
            'type': 'object',
            'x-custom-extension':
              'components.schemas.Foobar.x-custom-extension',
            'properties': {
              foobar: {
                'type': 'string',
                'x-custom-extension':
                  'components.schemas.Foobar.properties.foobar.x-custom-extension',
              },
            },
            'xml': {
              'name': 'Foobar',
              'x-custom-extension':
                'components.schemas.Foobar.xml.x-custom-extension',
            },
          },
        },
        'x-custom-extension': 'components.x-custom-extension',
      },
    }),
  },
]

const booleanAttributes = [
  'showSidebar',
  'hideClientButton',
  'isEditable',
  'hideModels',
  'hideDownloadButton',
  'hideTestRequestButton',
  'hideSearch',
  'darkMode',
  'hideDarkModeToggle',
  'withDefaultFonts',
  'defaultOpenAllTags',
] as const

const themes = [
  'alternate',
  'default',
  'moon',
  'purple',
  'solarized',
  'bluePlanet',
  'deepSpace',
  'saturn',
  'kepler',
  'elysiajs',
  'fastify',
  'mars',
  'none',
] as ThemeId[]
</script>

<template>
  <div class="debug-bar text-xs text-white">
    <div class="flex flex-col gap-4">
      <h2 class="border-b border-stone-700 p-4 text-sm font-bold">
        Developer Tools
      </h2>
      <div class="flex flex-col gap-2 px-2">
        <div class="flex flex-col gap-2 rounded-md border border-stone-700 p-2">
          <label class="flex items-center gap-2">
            <span>Layout</span>
            <select
              class="rounded border-stone-700 bg-stone-800 p-1"
              :value="modelValue.layout"
              @change="
                $emit('update:modelValue', {
                  ...modelValue,
                  layout: ($event.target as HTMLSelectElement).value as
                    | 'modern'
                    | 'classic',
                })
              ">
              <option value="modern">modern</option>
              <option value="classic">classic</option>
            </select>
          </label>
        </div>

        <div class="flex flex-col gap-2 rounded-md border border-stone-700 p-2">
          <label class="flex items-center gap-2">
            <span>Theme</span>
            <select
              class="rounded border-stone-700 bg-stone-800 p-1"
              :value="modelValue.theme"
              @change="
                $emit('update:modelValue', {
                  ...modelValue,
                  theme: ($event.target as HTMLSelectElement).value as ThemeId,
                })
              ">
              <option
                v-for="theme in themes"
                :key="theme"
                :value="theme">
                {{ theme }}
              </option>
            </select>
          </label>
        </div>

        <div class="flex flex-col gap-2 rounded-md border border-stone-700 p-2">
          <h3 class="font-bold">Sources</h3>
          <label
            v-for="(source, index) in sources"
            :key="index"
            class="flex items-center gap-2">
            <input
              :checked="
                modelValue.sources?.some(
                  (s) =>
                    (s.url && s.url === source.url) ||
                    (s.content && s.content === source.content),
                )
              "
              class="rounded border-stone-700 bg-stone-800"
              type="checkbox"
              @change="
                $emit('update:modelValue', {
                  ...modelValue,

                  sources: modelValue.sources?.some(
                    (s) =>
                      (s.url && s.url === source.url) ||
                      (s.content && s.content === source.content),
                  )
                    ? modelValue.sources.filter(
                        (s) =>
                          (s.url && s.url !== source.url) ||
                          (s.content && s.content !== source.content),
                      ).length > 0
                      ? modelValue.sources.filter(
                          (s) =>
                            (s.url && s.url !== source.url) ||
                            (s.content && s.content !== source.content),
                        )
                      : []
                    : [
                        ...(modelValue.sources || []),
                        {
                          title: source.title,
                          url: source.url,
                          content: source.content,
                        },
                      ],
                })
              " />
            <span>{{ source.title }}</span>
          </label>
        </div>

        <div class="flex flex-col gap-2 rounded-md border border-stone-700 p-2">
          <label
            v-for="attr in booleanAttributes"
            :key="attr"
            class="flex items-center gap-2">
            <input
              :checked="modelValue[attr]"
              class="rounded border-stone-700 bg-stone-800"
              type="checkbox"
              @change="
                $emit('update:modelValue', {
                  ...modelValue,
                  [attr]: !modelValue[attr],
                })
              " />
            <span>{{
              attr
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase())
            }}</span>
          </label>
        </div>
        <div class="rounded-md border border-stone-700 p-2">
          <pre><code class="block whitespace-pre overflow-x-scroll">{{ modelValue }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
