namespace Scalar.AspNetCore;

public sealed class ScalarDefaultHttpClient
{
    /// <summary>
    /// Default display target
    /// </summary>
    /// <value>The default value is <see cref="ScalarTarget.Shell" />.</value>
    public ScalarTarget TargetKey { get; set; } = ScalarTarget.Shell;

    /// <summary>
    /// Default display client
    /// </summary>
    /// <value>The default value is <see cref="ScalarClient.Curl" />.</value>
    public ScalarClient ClientKey { get; set; } = ScalarClient.Curl;
}