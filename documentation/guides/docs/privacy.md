# Privacy

## No analytics, no tracking

Docs is privacy-friendly by default:

- We do not inject third-party analytics scripts.
- We do not inject tracking scripts or cookies on custom domains.
- We do not use any form of fingerprinting technologies to uniquely identify users.

That said, you're free to [add any HTML/JS](./content/html-css-js.md) to your projects.

## Technically required cookies only

We use a small set of technically required cookies for authentication and the routing functionality:

- always: `scalar-docs-subpaths` contains just a string
- if authenticated: `scalar-registry-auth` contains your authentication token (HTTP Only, not accessible through JS)

## No IP logging

We do not log request traffic. Only internal proxy errors are logged, and those logs do not include IP addresses.
