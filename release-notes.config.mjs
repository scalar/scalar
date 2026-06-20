import { defineReleaseNotesConfig } from './packages/release-notes/dist/index.js'

export default defineReleaseNotesConfig({
  products: [
    {
      slug: 'api-client',
      packageName: 'scalar-app',
      displayName: 'Scalar API Client',
      description: 'a Vue-based open-source API testing client with desktop and web apps',
      changelogPath: 'projects/scalar-app/CHANGELOG.md',
      outputPath: 'projects/scalar-app/RELEASE_NOTES.json',
      dependencyChangelogPaths: ['packages/api-client/CHANGELOG.md'],
    },
    {
      slug: 'api-reference',
      packageName: '@scalar/api-reference',
      displayName: 'Scalar API Reference',
      description: 'a Vue component that renders beautiful API documentation from OpenAPI documents',
      changelogPath: 'packages/api-reference/CHANGELOG.md',
      outputPath: 'packages/api-reference/RELEASE_NOTES.json',
    },
    {
      slug: 'agent',
      packageName: '@scalar/agent-chat',
      displayName: 'Scalar Agent',
      description: 'an OpenAPI-backed agent chat UI and SDK for connecting APIs to LLMs',
      changelogPath: 'packages/agent-chat/CHANGELOG.md',
      outputPath: 'packages/agent-chat/RELEASE_NOTES.json',
    },
    {
      slug: 'mock-server',
      packageName: '@scalar/mock-server',
      displayName: 'Scalar Mock Server',
      description: 'a Node.js mock server that generates realistic API responses from OpenAPI documents',
      changelogPath: 'packages/mock-server/CHANGELOG.md',
      outputPath: 'packages/mock-server/RELEASE_NOTES.json',
    },
  ],
  github: {
    repo: 'scalar/scalar',
    baseBranch: 'main',
  },
  schema: {
    path: SCALAR_RELEASE_NOTES_SCHEMA_PATH,
    id: 'https://scalar.com/schemas/release-notes.schema.json',
    title: 'Scalar release notes',
  },
  prompts: {
    productDescriptionFallback: 'a Scalar product',
  },
})
