# Authentication

## Understanding Authentication in OpenAPI Documents

In the .NET ecosystem, there is a distinction between authentication mechanisms and their representation in OpenAPI documents. Simply adding an authentication scheme to the Dependency Injection (DI) container does not automatically include it in the OpenAPI document.

## How Scalar Works

`Scalar.AspNetCore` relies on the OpenAPI document to determine security schemes and requirements. If the OpenAPI document does not specify any security schemes, Scalar will not display any authentication options.

To include necessary authentication schemes in the OpenAPI document, implement an `OpenApiDocumentTransformer`. This allows you to add required security schemes to the OpenAPI document, ensuring `Scalar.AspNetCore` can recognize and display them. Multiple authentication schemes can be provided.
There is an [open GitHub issue](https://github.com/dotnet/aspnetcore/issues/39761) for automating this with .NET 10.

In the following sections, we will explain how to implement this transformer to add authentication schemes to your OpenAPI document.

## HTTP Authentication

### Configuring Bearer Authentication

To set up Bearer authentication in your API, configure the authentication scheme in the DI container:

```csharp
builder.Services.AddAuthentication().AddJwtBearer(options =>
{
    options.Authority = "http://localhost:8080/realms/master/.well-known/openid-configuration";
});
```

Next, add this security scheme to the OpenAPI document by creating a custom `OpenApiDocumentTransformer`:

```csharp
options.AddDocumentTransformer((document, _, _) =>
{
    var securityScheme = new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        In = ParameterLocation.Header,
        Scheme = "bearer"
    };
    document.Components ??= new OpenApiComponents();
    document.Components.SecuritySchemes.Add(JwtBearerDefaults.AuthenticationScheme, securityScheme);
    return Task.CompletedTask;
});
```

This transformer ensures that the required security scheme is included in the generated OpenAPI document. Once you start your project, you will see an option in the authentication dropdown.

### Adding a Global Security Requirement

Optionally, you can add a security requirement to the entire OpenAPI document. This step is not mandatory but can help enforce the use of the specified security scheme across all endpoints. Modify the `OpenApiDocumentTransformer` to include a security requirement:

```csharp
options.AddDocumentTransformer((document, _, _) =>
{
    var securityScheme = new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        In = ParameterLocation.Header,
        Scheme = "bearer"
    };
    document.Components ??= new OpenApiComponents();
    document.Components.SecuritySchemes.Add(JwtBearerDefaults.AuthenticationScheme, securityScheme);

    // Adds a global security requirement
    var referenceScheme = new OpenApiSecurityScheme
    {
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };
    
    document.SecurityRequirements.Add(new OpenApiSecurityRequirement
    {
        [referenceScheme] = []
    });

    return Task.CompletedTask;
});
```

This addition ensures that the security scheme is applied globally to all operations in the OpenAPI document.

### Prefilling the Token

To make the usage of this scheme easier, you can prefill the `Token` in the `MapScalarApiReference()` method:

```csharp
app.MapScalarApiReference(options => options.Authentication = new ScalarAuthenticationOptions
{
    PreferredSecurityScheme = JwtBearerDefaults.AuthenticationScheme,
    Http = new HttpOptions
    {
        Bearer = new HttpBearerOptions
        {
            Token = "my JWT token"
        }
    }
});
```

This configuration preselects the `Bearer` authentication scheme in the API Reference and pre-fills the token with a given value.

## OAuth Authentication

OAuth is a widely used authorization standard that typically uses a Bearer Token to authenticate users. It supports various flows, including Authorization Code, Implicit, and Client Credentials.

When integrating OAuth with your API, you need to configure the appropriate OAuth flow as a security scheme in your OpenAPI document. This ensures that `Scalar.AspNetCore` can recognize and display the necessary authentication options based on the selected OAuth flow. It is possible to provide multiple flows for a security scheme.

### Configuring OAuth (Client Credentials Flow)

To set up OAuth authentication in your API, configure the authentication scheme in the DI container:

```csharp
builder.Services.AddAuthentication().AddJwtBearer(options =>
{
    options.Authority = "http://localhost:8080/realms/master/.well-known/openid-configuration";
});
```

Next, add this security scheme to the OpenAPI document by creating a custom `OpenApiDocumentTransformer`:

```csharp
options.AddDocumentTransformer((document, _, _) =>
{
    var securityScheme = new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.OAuth2,
        Flows = new OpenApiOAuthFlows
        {
            ClientCredentials = new OpenApiOAuthFlow
            {
                TokenUrl = new Uri("https://your-authorization-server.com/connect/token")
            }
        }
    };
    document.Components ??= new OpenApiComponents();
    document.Components.SecuritySchemes.Add("OAuth", securityScheme);
    return Task.CompletedTask;
});
```

This transformer ensures that the required security scheme is included in the generated OpenAPI document. Once you start your project, you will see an option in the authentication dropdown.

### Adding a Global Security Requirement for OAuth

Optionally, add a security requirement to the entire OpenAPI document:

```csharp
options.AddDocumentTransformer((document, _, _) =>
{
    var securityScheme = new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.OAuth2,
        Flows = new OpenApiOAuthFlows
        {
            ClientCredentials = new OpenApiOAuthFlow
            {
                TokenUrl = new Uri("https://your-authorization-server.com/connect/token")
            }
        }
    };
    document.Components ??= new OpenApiComponents();
    document.Components.SecuritySchemes.Add("OAuth", securityScheme);

    // Adds a global security requirement
    var referenceScheme = new OpenApiSecurityScheme
    {
        Reference = new OpenApiReference
        {
            Id = "OAuth",
            Type = ReferenceType.SecurityScheme
        }
    };
    
    document.SecurityRequirements.Add(new OpenApiSecurityRequirement
    {
        [referenceScheme] = []
    });

    return Task.CompletedTask;
});
```

### Prefilling Credentials for OAuth

To make the usage of this scheme easier, you can prefill the `ClientId` in the `MapScalarApiReference()` method:

```csharp
app.MapScalarApiReference(options => options.Authentication = new ScalarAuthenticationOptions
{
    PreferredSecurityScheme = "OAuth",
    OAuth2 = new OAuth2Options
    {
        ClientId = "your-client-id"
    }
});
```

This configuration preselects the `OAuth` authentication scheme in the API Reference and pre-fills the token with a given value.