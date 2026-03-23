import { bench, describe } from 'vitest'

import { getMarkdownHeadings } from './get-markdown-headings'

const smallMarkdown = `
# Getting Started

Some introductory text.

## Installation

Run the install command.

### Requirements

Node.js v22 or later.
`

const mediumMarkdown = `
# API Reference

Welcome to the API reference documentation.

## Authentication

All API requests require a valid API key.

### API Key

Pass the key in the \`Authorization\` header.

### OAuth 2.0

We support the authorization code flow.

#### Scopes

- \`read\` — read-only access
- \`write\` — read and write access

## Endpoints

### GET /users

Returns a list of users.

\`\`\`json
{
  "users": [
    { "id": 1, "name": "Alice" }
  ]
}
\`\`\`

### POST /users

Creates a new user.

### GET /users/:id

Returns a single user.

#### Parameters

| Name | Type   | Description |
|------|--------|-------------|
| id   | number | User ID     |

## [Error Handling](#errors)

All errors follow RFC 7807.

### 400 Bad Request

### 401 Unauthorized

### 404 Not Found

### 500 Internal Server Error
`

const largeMarkdown = Array.from({ length: 50 }, (_, i) => {
  const depth = (i % 3) + 1
  const hashes = '#'.repeat(depth)
  return `${hashes} Section ${i + 1}

Paragraph content for section ${i + 1} with **bold**, *italic*, and \`code\`.

\`\`\`javascript
const x = ${i};
\`\`\`

Some more text after the code block.
`
}).join('\n')

describe('getMarkdownHeadings — small document (3 headings)', () => {
  bench('getMarkdownHeadings', () => {
    getMarkdownHeadings(smallMarkdown)
  })
})

describe('getMarkdownHeadings — medium document (14 headings)', () => {
  bench('getMarkdownHeadings', () => {
    getMarkdownHeadings(mediumMarkdown)
  })
})

describe('getMarkdownHeadings — large document (50 headings)', () => {
  bench('getMarkdownHeadings', () => {
    getMarkdownHeadings(largeMarkdown)
  })
})
