---
'@scalar/workspace-store': minor
---

feat: add `x-subTagPath` for unlimited sidebar nesting depth

Operations can now declare `x-subTagPath` — an ordered array of collapsible group names that defines an arbitrarily deep nesting path in the sidebar. Each element adds one collapsible level beneath the parent tag.

The resulting structure is:

```
x-tagGroups group  (non-collapsible section header)
  └── Tag           (collapsible)
        └── Level 1 (collapsible, x-subTagPath[0])
              └── Level 2 (collapsible, x-subTagPath[1])
                    └── Level 3 (collapsible, x-subTagPath[2])
                          └── Endpoint
```

Any number of levels is supported. Operations without `x-subTagPath` render flat under their tag.

**OpenAPI spec usage:**

```yaml
x-tagGroups:
  - name: Automated Prior Authorization (CMS-0057)
    tags: [Payer Catalog]

paths:
  /fhir/r4/PayerCatalog:
    get:
      tags: [Payer Catalog]
      summary: List all payers in the catalog
      x-subTagPath: [Payer Operations]                        # 1 level deep
    post:
      tags: [Payer Catalog]
      summary: Register a payer
      x-subTagPath: [Payer Operations, Single Payer]          # 2 levels deep
    put:
      tags: [Payer Catalog]
      summary: Update payer details
      x-subTagPath: [Payer Operations, Single Payer, Write]   # 3 levels deep
  /health:
    get:
      tags: [Payer Catalog]
      summary: Health check
      # no x-subTagPath — rendered flat under the tag
```
