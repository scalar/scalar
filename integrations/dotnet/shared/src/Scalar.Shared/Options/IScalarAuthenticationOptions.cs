#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#elif SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#elif SCALAR_AWS_LAMBDA
namespace Scalar.Aws.Lambda;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>Authentication configuration shared by the reference and individual documents.</summary>
public interface IScalarAuthenticationOptions
{
    /// <summary>Gets or sets the authentication configuration.</summary>
    ScalarAuthenticationOptions? Authentication { get; set; }
}