using Projects;
using Scalar.Aspire;

var builder = DistributedApplication.CreateBuilder(args);

var userService = builder
    .AddPnpmApp("user-service", "../Scalar.Aspire.UserService")
    .WithHttpEndpoint(env: "PORT");

var bookService = builder.AddProject<Scalar_Aspire_BookService>("book-service");

var scalar = builder.AddScalarApiReference(options => options.WithCdnUrl("https://cdn.jsdelivr.net/npm/@scalar/api-reference"));

scalar
    .WithApiReference(userService, options =>
    {
        options.WithTheme(ScalarTheme.Mars);
        options.WithDefaultHttpClient(ScalarTarget.JavaScript, ScalarClient.Fetch);
        options.AddDocument("external");
    })
    .WithApiReference(bookService, options =>
    {
        options.WithTheme(ScalarTheme.Saturn);
        options.WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
        options.WithOpenApiRoutePattern("/swagger/{documentName}.json");
    });

builder.Build().Run();