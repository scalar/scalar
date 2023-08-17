# Scalar

[![Test](https://github.com/a-numbered-company/api-reference/actions/workflows/test.yml/badge.svg)](https://github.com/a-numbered-company/api-reference/actions/workflows/test.yml)

This repository contains all our open source projects.

```
.
├── packages
│   ├── api-client (@scalar/api-client)
│   ├── api-reference (@scalar/api-reference)
│   ├── cli (@scalar/cli)
│   ├── swagger-editor (@scalar/swagger-editor)
│   ├── swagger-parser (@scalar/swagger-parser)
│   ├── use-clipboard (@scalar/use-clipboard)
│   ├── use-codemirror (@scalar/use-codemirror)
│   ├── use-keyboard-event (@scalar/use-keyboard-event)
│   └── use-tooltip (@scalar/use-tooltip)
└── projects
    ├── api-client-app (electron app)
    └── api-client-web (web app)
```

## Development

Install all dependencies:
`$ pnpm install`

Run the development server:
`$ pnpm run dev`

Build all packages:
`$ pnpm run build`

## Publishing new versions

Prepare the changelog for new versions:
`$ pnpm changeset`

Build, test and bump versions:
`$ pnpm bump`

Actually publish the packages (requires access to @scalar on npm):
`$ pnpm -r publish`