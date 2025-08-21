using Projects;
using Scalar.Aspire;

var builder = DistributedApplication.CreateBuilder(args);

builder.AddDockerComposeEnvironment("dev");

var userService = builder
    .AddPnpmApp("user-service", "../Scalar.Aspire.UserService")
    .WithHttpEndpoint(env: "PORT")
    .PublishAsDockerFile();

var bookService = builder.AddProject<Scalar_Aspire_BookService>("book-service");

var keycloak = builder
    .AddKeycloak("keycloak", 8080)
    .WithDataVolume()
    .WithRealmImport("./Realms")
    .WithEnvironment("KC_BOOTSTRAP_ADMIN_USERNAME", "admin")
    .WithEnvironment("KC_BOOTSTRAP_ADMIN_PASSWORD", "admin");

var scalar = builder
    .AddScalarApiReference(options =>
    {
        options
            .WithCdnUrl("https://cdn.jsdelivr.net/npm/@scalar/api-reference")
            .PreferHttpsEndpoint()
            .AllowSelfSignedCertificates();
    })
    .WithReference(keycloak)
    .WithExternalHttpEndpoints();


scalar
    .WithApiReference(bookService, options =>
    {
        options
            .WithTheme(ScalarTheme.Saturn)
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
            .WithOpenApiRoutePattern("/swagger/{documentName}.json")
            .AddPreferredSecuritySchemes("oauth2")
            .AddAuthorizationCodeFlow("oauth2", flow =>
            {
                flow.WithClientId("admin-cli");
            });
    })
    .WithApiReference(userService, options =>
    {
        options.WithTheme(ScalarTheme.Mars);
        options.WithDefaultHttpClient(ScalarTarget.JavaScript, ScalarClient.Fetch);
        options.AddDocument("external");
    });


bookService.WithEnvironment("Keycloak", keycloak.GetEndpoint("http"));

builder.Build().Run();