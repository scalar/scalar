# Docker image publishing

The Docker jobs in `workflows/publish-integrations.yml` use GitHub OIDC to
authenticate as the `scalarapi` Docker organization. They publish the API
reference, mock server, and Aspire images with short-lived credentials instead
of a stored Docker Hub token. Image names, version tags, and platforms are unchanged.

## Configure before merging

1. In Docker Home, select `scalarapi` and create an active GitHub Actions OIDC
   connection. The organization must have an eligible Docker subscription or
   participate in Docker Sponsored Open Source.
2. Add a ruleset with the subject
   `repo:scalar/scalar:environment:production-dockerhub`. The jobs use a GitHub
   environment, so their default subject contains the environment rather than
   `ref:refs/heads/main`. This repository currently uses GitHub's default,
   non-immutable subject format; recheck the subject if that configuration changes.
3. Grant Image Pull and Image Push only for these Docker Hub repositories:
   - `scalarapi/api-reference`
   - `scalarapi/mock-server`
   - `scalarapi/aspire-api-reference`
4. In the GitHub `production-dockerhub` environment, add the variable
   `DOCKERHUB_OIDC_CONNECTIONID` with the connection ID. This is a variable, not a
   secret. Keep the environment's deployment branch policy restricted to `main`:
   the environment-based subject does not itself restrict the branch.

The caller in `workflows/main.yml` already grants `id-token: write`. The reusable
workflow grants it to each Docker publishing job. Aspire publishes its image in
a separate job before packing its NuGet package, keeping the host-side NuGet
restore and pack steps without OIDC permissions. A missing or invalid connection
fails the image login; there is no stored-token fallback.

## Docker Hub descriptions

The `peter-evans/dockerhub-description` steps still use `DOCKERHUB_USERNAME` and
`DOCKERHUB_TOKEN` to synchronize the repository READMEs. That action authenticates
separately using Docker Hub credentials; it does not reuse the OIDC registry
login. Keep those secrets available in `production-dockerhub`. Do not delete or
revoke them as part of the image-login migration.

## Verify after rollout

PR checks validate the workflow configuration, but do not publish images or
exercise Docker's trust rules. During the next authorized release of each image,
verify that the OIDC login, version and `latest` tag pushes, and description
update succeed. For Aspire, also verify that packing starts after the image job
succeeds. If login fails, inspect the connection's Failures tab in Docker Home
and compare the incoming subject with the ruleset.

References: [Docker OIDC setup](https://docs.docker.com/security/authentication/oidc-connections/),
[rulesets and scopes](https://docs.docker.com/security/authentication/oidc-connections/rulesets-claims/),
[login action](https://github.com/docker/login-action),
[description action credentials](https://github.com/peter-evans/dockerhub-description#action-inputs).
