using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Microsoft.Extensions.Options;

namespace Scalar.Aws.Lambda;

/// <summary>
/// Creates a ready-to-use Lambda handler delegate for plain (non-DI) Lambda functions.
/// </summary>
public static class ScalarApiReferenceHandler
{
    /// <summary>
    /// Creates a request/response delegate that renders the Scalar API reference, without requiring a
    /// dependency injection container.
    /// </summary>
    /// <param name="configureOptions">An optional action to configure <see cref="ScalarOptions" />.</param>
    /// <returns>
    /// A delegate usable directly as a Lambda entry point, e.g.
    /// <c>public static Task&lt;APIGatewayHttpApiV2ProxyResponse&gt; Handler(APIGatewayHttpApiV2ProxyRequest request, ILambdaContext context) =&gt; ScalarApiReferenceHandler.Create()(request, context);</c>
    /// </returns>
    public static Func<APIGatewayHttpApiV2ProxyRequest, ILambdaContext, Task<APIGatewayHttpApiV2ProxyResponse>> Create(Action<ScalarOptions>? configureOptions = null)
    {
        var core = new ScalarApiReference(new StaticOptionsSnapshot(configureOptions));
        return (request, context) => core.HandleAsync(request, context);
    }

    /// <summary>
    /// A minimal <see cref="IOptionsSnapshot{TOptions}" /> adapter that builds a fresh <see cref="ScalarOptions" />
    /// instance on every access, mirroring the per-request lifetime <see cref="IOptionsSnapshot{TOptions}" />
    /// provides in the dependency injection path. This keeps <see cref="ScalarApiReference" /> as the single
    /// implementation of the transport logic shared by both entry points.
    /// </summary>
    private sealed class StaticOptionsSnapshot(Action<ScalarOptions>? configureOptions) : IOptionsSnapshot<ScalarOptions>
    {
        public ScalarOptions Value => Get(Options.DefaultName);

        public ScalarOptions Get(string? name)
        {
            var options = new ScalarOptions();
            configureOptions?.Invoke(options);
            return options;
        }
    }
}
