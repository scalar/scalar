# Evaluation rubric

Score each dimension **1-5** with a short note grounded in specifics from the input and output files. Lower scores mean higher-priority issues — they should produce an entry in `fixtures/evaluate/ideas/`.

| Score | Meaning |
| ----- | ------- |
| 5     | Complete and correct. No observable gap vs. the Postman source. |
| 4     | Minor cosmetic or edge-case gap. Usable as-is. |
| 3     | Noticeable gap that a consumer of the OpenAPI would work around. |
| 2     | Significant loss of information or incorrect structure. |
| 1     | Broken or missing entirely. |
| —     | N/A — the input does not exercise this dimension. |

## Dimensions

### 1. Conversion success
Did `convert()` return a document, or did it throw? For thrown errors, capture the error name and message verbatim from the run report. A throw is always a 1.

### 2. Description validity
Did `@scalar/openapi-parser` `validate()` accept the output against the OpenAPI Specification? Invalid description documents are at most a 2; list the top few validation errors in the report.

### 3. Request coverage
Count of Postman requests vs. resulting OpenAPI operations. A 5 means every request became an operation with the correct method. A 3 means several requests were dropped or merged incorrectly.

### 4. Path & parameters
- Does the path template match the Postman URL (including `{placeholder}` path params)?
- Are query parameters represented under `parameters` with sensible schemas?
- Are request-level headers preserved as `header` parameters (ignoring purely transport-level ones like `Host`, `Content-Length`)?

### 5. Auth fidelity
Postman supports auth at the collection, folder, and request level. A 5 means:
- collection-level auth → `security` + `components.securitySchemes`,
- folder/request overrides → per-operation `security`,
- auth type translated (bearer → `http bearer`, apikey → `apiKey`, basic → `http basic`, oauth2 → `oauth2`, …).

### 6. Body fidelity
- `raw` JSON → `application/json` with inferred schema.
- `raw` GraphQL → `application/json` with `query`/`variables` fields.
- `formdata` → `multipart/form-data` with per-field type (`text`/`file`).
- `urlencoded` → `application/x-www-form-urlencoded`.
- `file` → `application/octet-stream` or appropriate binary media type.

### 7. Response fidelity
Saved Postman example responses should become OpenAPI response entries with:
- correct status code (from `code`),
- correct media type (inferred from `Content-Type` header or response body shape),
- example payload preserved,
- schema inferred from the example when possible.

### 8. Metadata
- `info.title`, `info.description`, `info.version` sourced from the Postman `info` block.
- Folders translated to `tags` with descriptions.
- `operationId` present and unique across the document.

### 9. Servers
- Base URL extracted once per distinct host, not duplicated per path.
- Path templates relative to the server URL, not absolute (no leaked hostnames inside `paths`).
- Multi-host collections produce multiple `servers` entries.

### 10. Faithfulness
Output should not invent fields that are not grounded in the Postman input. Watch for:
- fabricated `description` text,
- guessed `example` values,
- security schemes that the collection never used,
- operation tags with no corresponding folder.

## Reporting format

In `fixtures/evaluate/reports/report.md`, produce a table like:

```
| collection        | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | notes |
| ----------------- | - | - | - | - | - | - | - | - | - | -- | ----- |
| stripe-public.json| 5 | 5 | 4 | 4 | 3 | 3 | 2 | 4 | 5 | 4  | see #12, #15 |
```

Follow the table with short per-collection sections calling out the evidence behind each score. At the bottom, summarise the top three most impactful patterns observed across the set.

## Idea files

For each distinct root cause that produced a sub-4 score in any collection, add or update `fixtures/evaluate/ideas/<kebab-slug>.md` using this shape:

```markdown
# <short title>

**Dimension:** <rubric dimension(s)>
**Severity:** low | medium | high
**Effort:** small | medium | large

## Problem
<what breaks, in 1-2 sentences>

## Evidence
- `stripe-public.json` — <excerpt + pointer>
- `twilio.json` — <excerpt + pointer>

## Suggested direction
<sketch of a fix, referencing relevant files in packages/postman-to-openapi/src/>
```
