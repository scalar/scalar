---
'@scalar/mock-server-docker': patch
---

feat(mock-server): allow disabling request validation in the Docker image with the `--no-validate-request` flag or the `VALIDATE_REQUEST=false` environment variable, so requests that violate the API description get a mock response instead of a `422`
