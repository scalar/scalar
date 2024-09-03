namespace Scalar.AspNetCore;

public sealed class ScalarDefaultHttpClient
{
    /// <summary>
    /// Default display target
    /// </summary>
    /// <value>The default value is <see cref="ScalarTargets.Shell" />.</value>
    public ScalarTargets TargetKey { get; set; } = ScalarTargets.Shell;

    /// <summary>
    /// Default display client
    /// </summary>
    /// <value>The default value is <see cref="ScalarClients.Curl" />.</value>
    public ScalarClients ClientKey { get; set; } = ScalarClients.Curl;
}