using Microsoft.AspNetCore.Authentication;
using Scalar.AspNetCore;
using Scalar.AspNetCore.Tests.Api;

var builder = WebApplication.CreateSlimBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddAuthentication("api-key")
    .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationSchemeHandler>("api-key", null);
builder.Services.AddAuthorizationBuilder().AddFallbackPolicy("fallback", policyBuilder => policyBuilder.RequireAuthenticatedUser());

var app = builder.Build();

app.MapOpenApi();

app.MapScalarApiReference().AllowAnonymous();

app.MapScalarApiReference("/api-reference").AllowAnonymous();

app.MapScalarApiReference("/auth/scalar");

#pragma warning disable CS0618 // Type or member is obsolete
app.MapScalarApiReference(options => options.WithEndpointPrefix("/legacy/{documentName}")).AllowAnonymous();
#pragma warning restore CS0618 // Type or member is obsolete

app.Run();

public partial class Program;