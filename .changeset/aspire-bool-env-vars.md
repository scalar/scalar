---
'@scalar/aspire': patch
---

fix(aspire): store boolean environment variables as strings so `aspire publish` to Azure Container Apps no longer fails with "Unsupported value type System.Boolean"
