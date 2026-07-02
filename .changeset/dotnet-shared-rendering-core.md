---
"@scalar/dotnet-shared": patch
"@scalar/aspnetcore": patch
---

chore: extract the hosting-agnostic HTML/static-asset rendering core into the shared project so it can be reused across .NET integrations. No public API or behavior change for `Scalar.AspNetCore`.
