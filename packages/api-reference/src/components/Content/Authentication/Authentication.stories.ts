// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/vue3'

import Authentication from './Authentication.vue'

const meta: Meta<typeof Authentication> = {
  title: 'Example/Authentication',
  component: Authentication,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof Authentication>

export const Default: Story = {
  render: (args) => ({
    components: {
      Authentication,
    },
    setup() {
      return { args }
    },
    template: `
        <Authentication v-bind="args" />
    `,
  }),
  args: {
    parsedSpec: {
      openapi: '3.1.0',
      info: {
        title: 'Example',
      },
      paths: {},
    },
  },
}

export const NoAuthentication: Story = {
  ...Default,
  args: {
    parsedSpec: {
      openapi: '3.1.0',
      info: {
        title: 'Example',
      },
      paths: {},
      components: {
        securitySchemes: {
          none: {},
        },
      },
    },
  },
}

export const BasicAuthentication: Story = {
  ...Default,
  args: {
    parsedSpec: {
      openapi: '3.1.0',
      info: {
        title: 'Example',
      },
      paths: {},
      components: {
        securitySchemes: {
          basic: {
            type: 'basic',
            description: 'Use HTTP **Basic** Auth.',
          },
        },
      },
    },
  },
}

export const BearerAuthentication: Story = {
  ...Default,
  args: {
    parsedSpec: {
      openapi: '3.1.0',
      info: {
        title: 'Example',
      },
      paths: {},
      components: {
        securitySchemes: {
          http: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Use HTTP **Bearer** Auth.',
          },
        },
      },
    },
  },
}

export const ApiKey: Story = {
  ...Default,
  args: {
    parsedSpec: {
      openapi: '3.1.0',
      info: {
        title: 'Example',
      },
      paths: {},
      components: {
        securitySchemes: {
          api_key: {
            type: 'apiKey',
            name: 'api_key',
            in: 'query',
          },
        },
      },
    },
  },
}

export const OpenAuth: Story = {
  ...Default,
  args: {
    parsedSpec: {
      openapi: '3.1.0',
      info: {
        title: 'Example',
      },
      paths: {},
      components: {
        securitySchemes: {
          oauth: {
            type: 'oAuth2',
            name: 'api_key',
            in: 'query',
          },
        },
      },
    },
  },
}

export const MultipleMethods: Story = {
  ...Default,
  args: {
    parsedSpec: {
      openapi: '3.1.0',
      info: {
        title: 'Example',
      },
      paths: {},
      components: {
        securitySchemes: {
          none: {},
          basic: {
            type: 'basic',
            description: 'Use HTTP **Basic** Auth.',
          },
          api_key: {
            type: 'apiKey',
            name: 'api_key',
            in: 'query',
          },
          oauth: {
            type: 'oAuth2',
            name: 'api_key',
            in: 'query',
          },
        },
      },
    },
  },
}
