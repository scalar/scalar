# Agent skills discovery

Scalar publishes an [Agent Skills Discovery RFC v0.2.0](https://github.com/cloudflare/agent-skills-discovery-rfc) index at
`https://scalar.com/.well-known/agent-skills/index.json`.

The index lives in `documentation/assets/.well-known/agent-skills/index.json`.
The `assetsDir` in `scalar.config.json` serves these assets from the site root,
including the `.well-known` directory.

The index lists the tracked repository skills in `.agents/skills`. Standalone
skills use commit-pinned raw GitHub URLs, so their content cannot change without
updating the index. The `scalar-design-system` skill includes reference files and
is distributed as an archive with `SKILL.md` at its root.

## Updating skills

When publishing a skill update, use a commit already available in `scalar/scalar`.
Update the skill's URL to that commit and copy its `name` and `description` from
the YAML frontmatter. Set `digest` to `sha256:` followed by the SHA-256 hash of
the artifact's raw bytes, including its final newline. Do not hash rendered
Markdown or reformatted text.

For the design system, regenerate the archive from the same published commit:

```bash
git archive --format=tar.gz \
  --output=documentation/assets/.well-known/agent-skills/scalar-design-system.tar.gz \
  <commit>:packages/themes/skills/scalar-design-system
shasum -a 256 documentation/assets/.well-known/agent-skills/scalar-design-system.tar.gz
```

Update the archive entry's digest after regenerating it. Keep all reference files
in the archive, with no wrapper directory.

## Checking publication

After the documentation site deploys, verify that the index returns HTTP 200 with
`Content-Type: application/json`. Each artifact must support GET and HEAD, and its
downloaded bytes must match its digest. Standalone skills must use `text/plain`
or `text/markdown`; the archive must use `application/gzip`.

The supplied [discovery check](https://isitagentready.com/.well-known/agent-skills/agent-skills/SKILL.md)
can also verify the live site:

```bash
curl https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' \
  --data '{"url":"https://scalar.com"}'
```

Check that `checks.discovery.agentSkills.status` is `"pass"`.
