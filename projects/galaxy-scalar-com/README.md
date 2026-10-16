# Galaxy Scalar Project

This project provides the playground for the mock server and is hosted at [`galaxy.scalar.com`](https://galaxy.scalar.com).

It is deployed to Cloudflare Pages. Releases deploy to production (`galaxy.scalar.com`); other commits to `main` deploy to staging (`galaxy.staging.scalar.com`).

Production loads the published API reference JavaScript from the CDN and the Galaxy OpenAPI document from the [registry](https://registry.scalar.com/@scalar/apis/galaxy?format=json). Staging and PR previews use the branch-built JavaScript and local `/openapi.yaml` document.
