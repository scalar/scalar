#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#elif SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#elif SCALAR_AWS_LAMBDA
namespace Scalar.Aws.Lambda;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Extension methods for <see cref="DeviceAuthorizationFlow"/>.
/// </summary>
public static class DeviceAuthorizationFlowExtensions
{
    /// <summary>
    /// Sets the device authorization URL for the device authorization flow.
    /// </summary>
    /// <param name="flow"><see cref="DeviceAuthorizationFlow"/>.</param>
    /// <param name="deviceAuthorizationUrl">The device authorization URL.</param>
    public static DeviceAuthorizationFlow WithDeviceAuthorizationUrl(this DeviceAuthorizationFlow flow, string? deviceAuthorizationUrl)
    {
        flow.DeviceAuthorizationUrl = deviceAuthorizationUrl;
        return flow;
    }

    /// <summary>
    /// Sets the token URL for the device authorization flow.
    /// </summary>
    /// <param name="flow"><see cref="DeviceAuthorizationFlow"/>.</param>
    /// <param name="tokenUrl">The token URL.</param>
    public static DeviceAuthorizationFlow WithTokenUrl(this DeviceAuthorizationFlow flow, string? tokenUrl)
    {
        flow.TokenUrl = tokenUrl;
        return flow;
    }

    /// <summary>
    /// Sets the client secret for the device authorization flow.
    /// </summary>
    /// <param name="flow"><see cref="DeviceAuthorizationFlow"/>.</param>
    /// <param name="clientSecret">The client secret.</param>
    public static DeviceAuthorizationFlow WithClientSecret(this DeviceAuthorizationFlow flow, string? clientSecret)
    {
        flow.ClientSecret = clientSecret;
        return flow;
    }

    /// <summary>
    /// Sets the location where authentication credentials should be placed in HTTP requests for the device authorization flow.
    /// </summary>
    /// <param name="flow"><see cref="DeviceAuthorizationFlow"/>.</param>
    /// <param name="credentialsLocation">The location for credentials.</param>
    public static DeviceAuthorizationFlow WithCredentialsLocation(this DeviceAuthorizationFlow flow, CredentialsLocation? credentialsLocation)
    {
        flow.CredentialsLocation = credentialsLocation;
        return flow;
    }
}