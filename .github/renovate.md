# Dependency update policy

Renovate opens routine update PRs on Mondays between 06:00 and 10:00 in
`Europe/Berlin`, including daylight saving time. The hosted app must run during
that window; this repository configuration does not schedule the app itself.

Patch, minor, pin, and digest updates use four repository-wide groups:

- **npm dependencies**, including npm CLI versions in workflows and Node 24 updates.
- **GitHub Actions**, including third-party actions. Secret-consuming actions retain
  their security-sensitive label and review warning.
- **Docker images**, including container images in GitHub Actions.
- **Native dependencies**: Python, Rust, Go, Maven, and NuGet.

An existing group PR is updated instead of opening another overlapping PR each
week. Major upgrades and breaking 0.x minor upgrades use separate PRs. Nothing is automerged. The existing limit
of five concurrent routine PRs still applies, so additional major updates can queue.

## Coordinated Playwright updates

Playwright uses a separate coordinated PR for its npm client, runner images,
helper default, and selected image release tag. The published
`scalarapi/playwright-runner` image tags drive every version lookup in this group.
This prevents an npm release from moving the client before the matching runner
is published. The npm manager updates the workspace catalog and lockfile, and
Renovate sync bumps move all companion pins in that same branch. Independent
runner-image updates are disabled to prevent partial moves, including during the
release-age waiting period.
Major Playwright upgrades are separate from its minor and patch updates.

Wrangler action versions already follow the installed catalog package. Netlify
CLI literals are extracted into the npm group so workflow pins stay aligned.

## Security updates

Supported GitHub vulnerability alerts open separate PRs outside the weekly
schedule, without routine PR concurrency limits or automerge. GitHub's dependency
graph, Dependabot alerts, and the Renovate app's alert-read permission must be
enabled. Renovate opens a fix when it detects an alert and a supported fixed version;
this configuration is not a continuous security scanner.

Security PRs bypass Renovate's routine release-age delay. The repository's pnpm
release-age policy and CI checks still apply and can require manual follow-up for
a very recent fix. This configuration does not weaken the pnpm install policy.

## Compatibility holds

Routine npm updates retain the one-day release delay and leave public peer ranges
for deliberate manual changes. The following lanes and holds remain in place:

- Node 24 runtime/types, with the existing Node 22/24 consumer support.
- TypeScript 5 consumers/Nuxt and TypeScript 6 compiler APIs.
- type-fest 5, vue-tsc 3.3.11, Nuxt module-builder 1.0.2, CVA beta.4, and Rolldown 1.3.2.
- Existing .NET, Spring Boot, Aspire, SDK, engine, and Node image exclusions.

Revisit the corresponding package rules when a hold is deliberately resolved.
