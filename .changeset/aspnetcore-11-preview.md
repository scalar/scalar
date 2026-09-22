---
'@scalar/aspnetcore': minor
---

Add .NET 11 RC1 support to the Microsoft OpenAPI integration while preserving .NET 9 and .NET 10 support.

While ASP.NET Core 11 is in preview, every target of `Scalar.AspNetCore.Microsoft`, including .NET 9 and .NET 10, is published with the `-rc.1` prerelease suffix. Existing consumers must opt into prerelease updates to receive these versions; stable-only consumers remain on the last stable release. `Scalar.AspNetCore` and `Scalar.AspNetCore.Swashbuckle` continue to receive stable releases.
