using System.Net;

namespace Scalar.Aspire.Tests;

public class ScalarIntegrationTests
{
    private static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(30);
    
    [Fact(Skip = "Test is not working yet")]
    public async Task AddScalarApiReference_ShouldReturnOk_WhenWebApplicationIsRunning()
    {
        // Arrange
        var appHost = await DistributedApplicationTestingBuilder.CreateAsync<Projects.Scalar_Aspire_Tests_AppHost>(TestContext.Current.CancellationToken);
        await using var app = await appHost.BuildAsync(TestContext.Current.CancellationToken).WaitAsync(DefaultTimeout, TestContext.Current.CancellationToken);
        await app.StartAsync(TestContext.Current.CancellationToken);
    
        // Act
        var httpClient = app.CreateHttpClient("scalar", "http");
        await app.ResourceNotifications.WaitForResourceHealthyAsync("scalar", TestContext.Current.CancellationToken).WaitAsync(DefaultTimeout, TestContext.Current.CancellationToken);
        var response = await httpClient.GetAsync("/", TestContext.Current.CancellationToken);
    
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}