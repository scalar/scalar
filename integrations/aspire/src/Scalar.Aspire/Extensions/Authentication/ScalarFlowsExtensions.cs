namespace Scalar.Aspire;

/// <summary>
/// Extension methods for <see cref="ScalarFlows"/>.
/// </summary>
public static class ScalarFlowsExtensions
{
    /// <summary>
    /// Sets the implicit flow configuration.
    /// </summary>
    /// <param name="flows"><see cref="ScalarFlows"/>.</param>
    /// <param name="configureImplicitFlow">The implicit flow configuration.</param>
    public static ScalarFlows WithImplicit(this ScalarFlows flows, Action<ImplicitFlow> configureImplicitFlow)
    {
        flows.Implicit ??= new ImplicitFlow();
        configureImplicitFlow(flows.Implicit);
        return flows;
    }

    /// <summary>
    /// Sets the password flow configuration.
    /// </summary>
    /// <param name="flows"><see cref="ScalarFlows"/>.</param>
    /// <param name="passwordFlow">The password flow configuration.</param>
    public static ScalarFlows WithPassword(this ScalarFlows flows, Action<PasswordFlow> passwordFlow)
    {
        flows.Password ??= new PasswordFlow();
        passwordFlow(flows.Password);
        return flows;
    }

    /// <summary>
    /// Sets the client credentials flow configuration.
    /// </summary>
    /// <param name="flows"><see cref="ScalarFlows"/>.</param>
    /// <param name="configureClientCredentialsFlow">An action to configure the flow.</param>
    public static ScalarFlows WithClientCredentials(this ScalarFlows flows, Action<ClientCredentialsFlow> configureClientCredentialsFlow)
    {
        flows.ClientCredentials ??= new ClientCredentialsFlow();
        configureClientCredentialsFlow(flows.ClientCredentials);
        return flows;
    }

    /// <summary>
    /// Sets the authorization code flow configuration.
    /// </summary>
    /// <param name="flows"><see cref="ScalarFlows"/>.</param>
    /// <param name="configureAuthorizationCodeFlow">An action to configure the flow.</param>
    public static ScalarFlows WithAuthorizationCode(this ScalarFlows flows, Action<AuthorizationCodeFlow> configureAuthorizationCodeFlow)
    {
        flows.AuthorizationCode ??= new AuthorizationCodeFlow();
        configureAuthorizationCodeFlow(flows.AuthorizationCode);
        return flows;
    }
}