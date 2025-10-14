global using static Scalar.AspNetCore.ExtensionKeys;
global using static Scalar.AspNetCore.JsonSerializerHelper;
global using Microsoft.AspNetCore.OpenApi;
#if NET9_0
global using Microsoft.OpenApi.Any;
global using Microsoft.OpenApi.Interfaces;
global using Microsoft.OpenApi.Models;
#else
global using Microsoft.OpenApi;
#endif