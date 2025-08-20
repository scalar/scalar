using Yarp.ReverseProxy.Forwarder;

namespace Scalar.Aspire.Service;

internal static partial class LoggerMessages
{
    [LoggerMessage(LogLevel.Information, "Proxy request received for target URL: {TargetUrl}")]
    internal static partial void LogProxyRequestReceived(this ILogger logger, string targetUrl);

    [LoggerMessage(LogLevel.Warning, "Invalid target URL provided: {TargetUrl}")]
    internal static partial void LogInvalidTargetUrl(this ILogger logger, string targetUrl);

    [LoggerMessage(LogLevel.Debug, "Forwarding request to target host: {TargetHost}, URI: {TargetUri}")]
    internal static partial void LogForwardingRequest(this ILogger logger, string targetHost, Uri targetUri);

    [LoggerMessage(LogLevel.Error, "Proxy error occurred: {Error} for target URL: {TargetUrl}")]
    internal static partial void LogProxyError(this ILogger logger, ForwarderError error, string targetUrl);

    [LoggerMessage(LogLevel.Debug, "Proxy response received with status code: {StatusCode}")]
    internal static partial void LogProxyResponse(this ILogger logger, int statusCode);

    [LoggerMessage(LogLevel.Debug, "Redirect response detected with location: {Location}")]
    internal static partial void LogRedirectDetected(this ILogger logger, string? location);

    [LoggerMessage(LogLevel.Information, "Rewriting localhost redirect from {OriginalLocation} to {RewrittenLocation}")]
    internal static partial void LogLocalhostRedirectRewrite(this ILogger logger, string originalLocation, string rewrittenLocation);

    [LoggerMessage(LogLevel.Debug, "Redirect to non-localhost URL, keeping original location: {Location}")]
    internal static partial void LogNonLocalhostRedirect(this ILogger logger, string location);

    [LoggerMessage(LogLevel.Warning, "Invalid or missing location header in redirect response: {Location}")]
    internal static partial void LogInvalidRedirectLocation(this ILogger logger, string? location);

    [LoggerMessage(LogLevel.Information, "Proxy request completed successfully for target URL: {TargetUrl}")]
    internal static partial void LogProxyRequestCompleted(this ILogger logger, string targetUrl);

    [LoggerMessage(LogLevel.Error, "Unexpected error occurred while proxying request to {TargetUrl}")]
    internal static partial void LogUnexpectedProxyError(this ILogger logger, Exception exception, string targetUrl);
}