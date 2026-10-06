# Agent skills discovery

Scalar publishes an [Agent Skills Discovery RFC v0.2.0](https://github.com/cloudflare/agent-skills-discovery-rfc) index at
`https://scalar.com/.well-known/agent-skills/index.json`.

The index and its skill artifacts live in
`documentation/assets/.well-known/agent-skills`. The `assetsDir` in
`scalar.config.json` serves these assets from the site root, including the
`.well-known` directory.

Only these Scalar product skills are published:

- `scalar-mock-server`, sourced from `.agents/skills/mock-server/SKILL.md`.
- `scalar-docs`, sourced from `.agents/skills/scalar-docs/SKILL.md`.

## Updating skills

Copy the updated source into the matching published skill directory. Set the
published mock-server skill's frontmatter `name` to `scalar-mock-server`.
The index's `name` and `description` must match the published YAML frontmatter.

Set `digest` to `sha256:` followed by the SHA-256 hash of the published artifact's
raw bytes, including its final newline. Do not hash rendered Markdown or
reformatted text. Update the artifact and index together.

```bash
shasum -a 256 documentation/assets/.well-known/agent-skills/scalar-mock-server/SKILL.md
shasum -a 256 documentation/assets/.well-known/agent-skills/scalar-docs/SKILL.md
```

## Checking publication

After the documentation site deploys, verify that the index returns HTTP 200 with
`Content-Type: application/json`. Each artifact must support GET and HEAD, use
`text/plain` or `text/markdown`, and its downloaded bytes must match its digest.

The supplied [discovery check](https://isitagentready.com/.well-known/agent-skills/agent-skills/SKILL.md)
can also verify the live site:

```bash
curl https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' \
  --data '{"url":"https://scalar.com"}'
```

Check that `checks.discovery.agentSkills.status` is `"pass"`.
