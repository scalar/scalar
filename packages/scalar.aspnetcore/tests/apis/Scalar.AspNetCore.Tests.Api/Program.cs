using Scalar.AspNetCore;

var builder = WebApplication.CreateSlimBuilder(args);

builder.Services.AddOpenApi();

var app = builder.Build();

app.MapOpenApi();

app.MapScalarApiReference();

app.MapScalarApiReference("/api-reference");

#pragma warning disable CS0618 // Type or member is obsolete
app.MapScalarApiReference(options => options.WithEndpointPrefix("/legacy/{documentName}"));
#pragma warning restore CS0618 // Type or member is obsolete

app.Run();

public partial class Program;