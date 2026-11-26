/* Supabase's API reference as a third face for the docs hero.
 *
 * Supabase publish theirs with Scalar — api.supabase.com/api/v1 — so this
 * is not a new design but the same reference the other two windows are
 * showing, with Supabase's content in it. It is therefore built by relaying
 * the Zoom drawing, which is that same reference: the chrome, the sidebar
 * and the two columns stay, and only the words and the lockup change.
 *
 * Every fact comes out of Supabase's own document at
 * https://api.supabase.com/api/v1-json — operation v1-create-project
 * (POST /v1/projects, summary "Create a project", tag Projects, OAuth
 * scope projects:write), its V1CreateProjectBody with name,
 * organization_slug and db_pass required and region optional, its four
 * response codes, and V1ProjectResponse_Output for the example. The
 * sidebar lists real operations from the same tag, kept to the short ones.
 */

/* their lockup, out of documentation/assets/remote/logo-supabase.svg */
const MARK =
  '<svg class="sb-mark" viewBox="0 0 113 113" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M63.7 110.3a4.9 4.9 0 0 1-8.7-3l-1-67.2h45.2a9.8 9.8 0 0 1 7.7 15.8l-43.2 54.4Z"/>' +
  '<path d="M45.3 2A4.9 4.9 0 0 1 54 5l.5 67.3H9.8a9.8 9.8 0 0 1-7.6-15.9L45.3 2.1Z"/></svg>'

const WORD =
  '<svg class="sb-word" viewBox="151 0 430 113" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M151.4 66.8c.6 5.6 5.7 15.2 20.5 15.2 12.9 0 19-8.2 19-16.2 0-7.2-4.8-13.1-14.5-15.1l-7-1.5c-2.7-.5-4.5-2-4.5-4.4 0-2.8 2.8-5 6.3-5 5.6 0 7.7 3.8 8 6.7l11.2-2.5c-.6-5.3-5.3-14.2-19.3-14.2-10.6 0-18.4 7.3-18.4 16 0 7 4.3 12.7 13.8 14.8L173 62c3.8.8 5.3 2.6 5.3 4.8 0 2.6-2.1 4.9-6.5 4.9-5.8 0-8.7-3.6-9-7.5l-11.4 2.5ZM233.4 80.5h12.7a81 81 0 0 1-.5-9V31.4h-13.3v28.6c0 5.7-3.4 9.7-9.3 9.7-6.2 0-9-4.4-9-10V31.4h-13.2v31c0 10.8 6.7 19.5 18.6 19.5 5.2 0 11-2 13.6-6.6 0 2 .2 4.3.4 5.3ZM273 99.5V75.7c2.5 3.3 7.5 6 14.3 6 13.8 0 23.1-11 23.1-26 0-14.5-8.3-25.5-22.6-25.5-7.4 0-13 3.3-15.1 7v-6h-13v68.3h13.4Zm24.4-43.6c0 8.8-5.4 13.9-12.2 13.9-6.8 0-12.3-5.2-12.3-14 0-8.6 5.5-13.7 12.3-13.7 6.8 0 12.2 5 12.2 13.8ZM318 67c0 7.8 6.4 14.9 16.8 14.9 7.3 0 12-3.4 14.5-7.3 0 1.9.2 4.6.5 5.9H362c-.3-1.7-.6-5.2-.6-7.8V48.5c0-10-5.8-18.7-21.4-18.7-13.1 0-20.2 8.5-21 16.2l11.8 2.5c.4-4.3 3.5-8 9.3-8 5.6 0 8.3 2.9 8.3 6.4 0 1.7-.9 3-3.7 3.5l-12 1.8c-8.2 1.2-14.7 6-14.7 14.9Zm19.6 5c-4.3 0-6.4-2.8-6.4-5.7 0-3.8 2.7-5.7 6.1-6.2l11.1-1.7v2.2c0 8.7-5.2 11.4-10.8 11.4ZM387.7 80.5v-6c2.6 4.2 7.8 7.2 14.6 7.2 14 0 23.2-11.1 23.2-26 0-14.6-8.3-25.7-22.7-25.7-7.3 0-12.7 3.2-14.9 6.7V8h-13v72.5h12.8Zm24.5-24.7c0 9-5.4 14-12.2 14-6.7 0-12.3-5.1-12.3-14 0-9 5.6-14 12.3-14 6.8 0 12.2 5 12.2 14ZM433 67c0 7.8 6.4 14.9 16.9 14.9 7.3 0 12-3.4 14.5-7.3 0 1.9.2 4.6.5 5.9H477c-.3-1.7-.6-5.2-.6-7.8V48.5c0-10-5.7-18.7-21.3-18.7-13.2 0-20.3 8.5-21.1 16.2l11.8 2.5c.4-4.3 3.6-8 9.4-8 5.6 0 8.3 2.9 8.3 6.4 0 1.7-1 3-3.7 3.5l-12.1 1.8c-8.2 1.2-14.7 6-14.7 14.9Zm19.7 5c-4.3 0-6.4-2.8-6.4-5.7 0-3.8 2.7-5.7 6-6.2l11.2-1.7v2.2c0 8.7-5.2 11.4-10.8 11.4ZM485.6 66.8c.6 5.6 5.7 15.2 20.5 15.2 13 0 19.1-8.2 19.1-16.2 0-7.2-4.9-13.1-14.6-15.1l-7-1.5c-2.7-.5-4.5-2-4.5-4.4 0-2.8 2.8-5 6.3-5 5.6 0 7.7 3.8 8.1 6.7l11.1-2.5c-.6-5.3-5.3-14.2-19.3-14.2-10.6 0-18.4 7.3-18.4 16 0 7 4.3 12.7 13.8 14.8l6.5 1.5c3.8.8 5.3 2.6 5.3 4.8 0 2.6-2 4.9-6.5 4.9-5.8 0-8.7-3.6-9-7.5l-11.4 2.5ZM545.4 50.3c.3-4.5 4-9.7 11-9.7 7.6 0 10.8 4.8 11 9.7h-22ZM568.7 63c-1.6 4.4-5 7.5-11.2 7.5-6.6 0-12.1-4.7-12.4-11.2h35.2l.2-4.1c0-15.8-9.1-25.5-24.3-25.5-12.6 0-24.2 10.2-24.2 25.9A25 25 0 0 0 557.4 82c12 0 19.9-7.1 22.4-15.6L568.7 63Z"/></svg>'

const CHEVRON =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" class="h-animation-14" viewBox="0 0 24 24">' +
  '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m4.5 8.25 7.5 7.5 7.5-7.5"/></svg>'

/* the Projects tag, kept to its short names — a lot of theirs run to a
   line and a half, which reads as noise at this size */
const SIDEBAR = [
  ['Create a project', 'POST', 'h-green'],
  ['List all projects', 'GET', 'h-blue'],
  ['Updates the given project', 'PATCH', 'h-orange'],
  ['Get disk utilization', 'GET', 'h-blue'],
  ['Modify database disk', 'POST', 'h-green'],
]

const TAGS = [
  'Database',
  'Edge Functions',
  'Auth',
  'Storage',
  'Secrets',
  'Organizations',
  'Domains',
  'Analytics',
  'Advisors',
]

const FIELD = (name, type, required, description) =>
  `<div class="h-markdown-item"><span class="h-black">${name}</span><span class="h-grey">${type}</span>${
    required ? '<span class="h-orange">Required</span>' : ''
  }<div class="h-markdown-item-description"><span class="h-grey">${description}</span></div></div>`

const RESPONSE = (code, text) =>
  `<div class="h-markdown-item">${CHEVRON}<span class="h-black">${code}</span><span class="h-grey">${text}</span></div>`

const JSON_LINES = [
  '{',
  '  "ref": "abcdefghijklmnopqrst",',
  '  "name": "Acme",',
  '  "organization_slug": "acme",',
  '  "region": "us-east-1",',
  '  "status": "COMING_UP",',
  '  "created_at": "2026-04-18T09:12:44Z"',
  '}',
]

const CONTENT = `
  <div class="h-animation-endpoint-markdown">
    <div class="h-animation-header">Create a project</div>
    <div class="h-markdown">
      <p>Creates a project in an organization.</p>
      <div class="h-markdown-list">
        <div class="h-markdown-heading"><span class="h-black">Body</span><span class="h-grey">application/json</span></div>
        ${FIELD('name', 'string', true, 'Name of your project')}
        ${FIELD('organization_slug', 'string', true, 'Organization slug')}
        ${FIELD('db_pass', 'string', true, 'Database password')}
        ${FIELD('region', 'string', false, 'Region you want your server to reside in')}
        <div class="h-markdown-list">
          <div class="h-markdown-heading"><span class="h-black">Responses</span></div>
          ${RESPONSE(201, 'The project, while it comes up.')}
          ${RESPONSE(401, 'Unauthorized')}
          ${RESPONSE(403, 'Forbidden action')}
          ${RESPONSE(429, 'Rate limit exceeded')}
        </div>
      </div>
    </div>
  </div>
  <div class="h-animation-endpoint-meta">
    <div class="ello"></div>
    <div class="h-animation-endpoint-code">
      <div class="h-animation-endpoint-code-header"><span class="h-green">POST</span><span class="h-grey">/v1/projects</span><span class="h-grey ml-auto">Shell Curl</span></div>
      <div class="h-animation-endpoint-code-body">
        <div><span>1</span><span class="h-purple">curl</span><span class="h-black">https://api.supabase.com/v1/projects</span><span class="h-grey">\\</span></div>
        <div class="body-second"><span>2</span><span class="h-black">--request</span><span class="h-grey">POST \\</span></div>
        <div class="body-second"><span>3</span><span class="h-black">--header</span><span class="h-grey">'Authorization: Bearer YOUR_SECRET_TOKEN'</span></div>
      </div>
      <div class="h-animation-endpoint-code-footer"><span class="button-press">Test Request</span></div>
    </div>
    <div class="h-animation-endpoint-code h-animation-endpoint-code-tabs sb-json">
      <div class="h-animation-endpoint-code-header"><span>201</span><span class="h-grey">401</span><span class="h-grey">403</span><span class="h-grey">429</span><span class="h-grey ml-auto">Show Schema</span></div>
      <div class="h-animation-endpoint-code-body">
        ${JSON_LINES.map((line, i) => `<div${i ? ' class="body-second"' : ''}><span>${i + 1}</span><span class="h-black">${line}</span></div>`).join('')}
      </div>
    </div>
  </div>
`

export const supabase = {
  key: 'supabase',
  light: 'api-docs-static-zoom',
  dark: 'api-docs-static-zoom-dark',
  url: 'api.supabase.com/api/v1',
  css: `
    /* their lockup in place of the other site's, drawn in the page's own
       ink rather than their brand green, as the drawn portals' lockups
       are. The badges need nothing said about them: the artwork this
       face is laid out from puts .h-green on the same ink, and the one
       place it does not -- a field marked Required in a parameter row --
       is the quieter grey on purpose. */
    .h-animation-doc-header { gap: 7px !important; }
    .sb-mark { height: 19px; width: 19px; margin: 0; color: var(--scalar-color-1); }
    .sb-word { height: 14px; width: 54px; margin: 0; }
    /* the response body is one string a line, so its indent has to stand */
    .sb-json .h-animation-endpoint-code-body span + span { white-space: pre; }
  `,
  rewrite: {
    header: `${MARK}${WORD}`,
    sidebar: { folder: 'Projects', endpoints: SIDEBAR, tags: TAGS },
    content: CONTENT,
  },
  markdown: `---
title: Create a project
operation: POST https://api.supabase.com/v1/projects
scope: projects:write
---

# Create a project

Creates a project in an organization.

\`POST /v1/projects\`

## Body

\`application/json\`

* \`name\` (string, required) — Name of your project
* \`organization_slug\` (string, required) — Organization slug
* \`db_pass\` (string, required) — Database password
* \`region\` (string) — Region you want your server to reside in: \`us-east-1\`, \`us-east-2\`, \`us-west-1\`, \`us-west-2\`, \`ap-east-1\`, \`ap-southeast-1\`, \`ap-northeast-1\`, \`ap-northeast-2\` and the rest

## Responses

* \`201\` The project, while it comes up: \`ref\`, \`name\`, \`organization_slug\`, \`region\`, \`created_at\`, \`status\`
* \`401\` Unauthorized
* \`403\` Forbidden action
* \`429\` Rate limit exceeded

## Request

\`\`\`sh
curl https://api.supabase.com/v1/projects \\
  --request POST \\
  --header 'Authorization: Bearer YOUR_SECRET_TOKEN' \\
  --data '{ "name": "Acme", "organization_slug": "acme", "db_pass": "…" }'
\`\`\`

[Management API](https://api.supabase.com/api/v1) · [Projects](https://supabase.com/docs/reference/api/v1-create-a-project)
`,
}
