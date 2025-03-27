using System.Collections.Immutable;
using Aspire.Hosting.ApplicationModel;
using Aspire.Hosting.Lifecycle;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.DependencyInjection;

namespace Scalar.Aspire;

internal sealed class ScalarHook(ResourceNotificationService resourceNotificationService, IServiceProvider serviceProvider) : IDistributedApplicationLifecycleHook, IAsyncDisposable
{
    private WebApplication? _app;

    public ValueTask DisposeAsync() => _app?.DisposeAsync() ?? ValueTask.CompletedTask;

    public async Task AfterEndpointsAllocatedAsync(DistributedApplicationModel appModel, CancellationToken cancellationToken = default)
    {
        var scalarResource = appModel.Resources.OfType<ScalarResource>().FirstOrDefault();

        if (scalarResource is null)
        {
            return;
        }

        _app = ScalarWebApplication.Create(serviceProvider, scalarResource);

        await _app.StartAsync(cancellationToken);

        var addresses = _app.Services.GetRequiredService<IServer>().Features.GetRequiredFeature<IServerAddressesFeature>().Addresses;

        var urls = addresses.Select(url => new UrlSnapshot(url, url, false)).ToImmutableArray();

        await resourceNotificationService.PublishUpdateAsync(scalarResource, s => s with
        {
            State = "Running",
            Urls = urls,
            StartTimeStamp = DateTime.Now
        });
    }
}