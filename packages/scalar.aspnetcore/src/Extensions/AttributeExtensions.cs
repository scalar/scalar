using System.ComponentModel;

namespace Scalar.AspNetCore;

// TODO: Replace with source generated approach
internal static class AttributeExtensions
{
    public static string GetDescription(this Enum enumValue)
    {
        var field = enumValue.GetType().GetField(enumValue.ToString());
        if (field == null)
        {
            return enumValue.ToString();
        }

        if (Attribute.GetCustomAttribute(field, typeof(DescriptionAttribute)) is DescriptionAttribute attribute)
        {
            return attribute.Description;
        }

        return enumValue.ToString();
    }
}