# How .NET 9 and Scalar solve the problem of under-documented APIs

Stop me if you’ve heard this one before:

1. You finish and ship a change to your API.
2. You don’t bother to document it.
3. You forget to generate and/or update the API docs.
4. You definitely don’t publish the newly updated API docs so others can actually use it.

This under-documentation means fewer people being able to use the API, more confusion when you return to this code, and makes it trickier to debug if issues occur.

We don’t blame you for under-documenting your API. In many codebases, the documentation is disconnected from the actual code. This creates needless work in the process of documenting, updating, and publishing API docs.

With the release of .NET 9 in combination with Scalar, we are changing this.

## What’s changed with the .NET 9 release?

The `ASP.NET` ecosystem used to have a solution for working with APIs documents in Swashbuckle. This generated API documentation and a UI for your ASP.NET Core API and was a solution to the under-documented problem.

The big problem is that Swashbuckle has not kept up with .NET releases. There was not an official release for .NET 8 and has otherwise seemingly been abandoned. No PRs have been merged since November 2022.

To fix this gap, the ASP.NET Core team is [removing Swashbuckle](https://github.com/dotnet/aspnetcore/issues/54599) with the release of .NET 9 and replacing it with their own solution for OpenAPI document generation.

What this looks like is built-in support for OpenAPI document generation via the `Microsoft.AspNetCore.OpenApi` and `Microsoft.Extensions.ApiDescription.Server` packages. This [generates](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/aspnetcore-openapi?view=aspnetcore-9.0&tabs=visual-studio%2Cminimal-apis#using-scalar-for-interactive-api-documentation) a JSON OpenAPI document automatically based on a map of the API.

For example, after installing both packages, add `builder.Services.AddOpenApi();` and `app.MapOpenApi();` to your `Program.cs` file:

```
var builder = WebApplication.CreateBuilder();

builder.Services.AddOpenApi();

var app = builder.Build();

app.MapOpenApi();

app.MapGet("/", () => "Hello world!");

app.Run();
```

Running this then generates an OpenAPI document at `https://localhost:<port>/openapi/v1.json`.

[![Dotnet 9 OpenAPI](https://substackcdn.com/image/fetch/$s_!CkN3!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7f04e6c4-42a9-48a7-82e8-9fb654dbe118_1480x1190.png "Dotnet 9 OpenAPI")](https://substackcdn.com/image/fetch/$s_!CkN3!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7f04e6c4-42a9-48a7-82e8-9fb654dbe118_1480x1190.png)

Generating this is document is a great first step, but is only part of the solution. It then needs to be turned into documentation people can use. This is where Scalar’s suite of API tools come in.

## Setting up Scalar’s ASP.NET package

Thanks to [@captainsafia](https://github.com/captainsafia) and [@xC0dex](https://github.com/xC0dex) of our community, Scalar has a ASP.NET API package.

To set it up, simply install the package:

```
dotnet add package Scalar.AspNetCore
```

And add the directive and `MapScalarApiReference()` to your program:

```
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder();

builder.Services.AddOpenApi();

var app = builder.Build();

app.MapOpenApi();
app.MapScalarApiReference();

app.MapGet("/", () => "Hello world!");

app.Run();
```

Like magic, this gives you a full set of API docs when you navigate to `https://localhost:<port>/scalar/v1` in your browser.

[![Dotnet 9 API docs](https://substackcdn.com/image/fetch/$s_!kaOL!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fad9851fe-7441-49bc-9a95-a3022904481e_2842x1618.png "Dotnet 9 API docs")](https://substackcdn.com/image/fetch/$s_!kaOL!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fad9851fe-7441-49bc-9a95-a3022904481e_2842x1618.png)

## Under the hood of how Scalar generates your API docs

You might be asking “how did that happen so quickly?” Well, when you add and run Scalar in your ASP.NET API, we do the following:

1. Configure Scalar options including the location of your OpenAPI document and any customizations you want like titles, themes, and authentication
2. Map a GET endpoint to your API that serves a page.
3. On that page, use your OpenAPI document and Scalar configuration to load your version of Scalar’s API docs from a CDN.

This creates a complete set of API docs in a simple to use UI without all of the work of building it. For further customization, [you can create an account](https://docs.scalar.com/register) and edit your docs however you like.

## Solving the under-documented API problem

The combination of new ASP.NET OpenAPI generation and Scalar solves the undocumented API problem. No more needing to document, generate, update, and serve your API docs.

We don’t stop there either. Our API seamlessly turn into a fully featured API client. This means you not only get to document your API but test it. This is a core part of our aim of creating a world-class developer experience for your APIs.

[![Dotnet 9 API client](https://substackcdn.com/image/fetch/$s_!nm9-!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7cf53bcc-3c00-48ad-a283-4e5202aa06db_2868x1624.png "Dotnet 9 API client")](https://substackcdn.com/image/fetch/$s_!nm9-!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7cf53bcc-3c00-48ad-a283-4e5202aa06db_2868x1624.png)

**Mar 5, 2025**
