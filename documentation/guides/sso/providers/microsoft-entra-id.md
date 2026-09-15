# Microsoft Entra ID (Formerly Azure AD)

Configure SAML-based SSO between Microsoft Entra ID and Scalar.

## Requirements

* SSO/SAML requires a Scalar Enterprise subscription. Read more about [our pricing](../../pricing.md).
* You are the owner or admin of your Scalar team.

## 1. Create a New Enterprise Application

Navigate to **Enterprise applications** in the Microsoft Entra ID sidebar and select **New application**. Choose **Create your own application** and enter a name (e.g., "Scalar"):

### Create Your Own Application

![](../../../assets/sso/microsoft-entra-id/microsoft-create-your-own-application.png)

## 2. Assign Users and Groups

After creating the application, assign the users and groups that should have access to Scalar:

### Users and Groups

![](../../../assets/sso/microsoft-entra-id/microsoft-entra-users-and-groups.png)

## 3. Select SAML Authentication

Go to **Single sign-on** and select **SAML** as the authentication method:

### Select Single Sign-On Method

![](../../../assets/sso/microsoft-entra-id/microsoft-select-single-sign-on-method.png)

## 4. Create a Connection in Scalar

Before configuring SAML settings, create a new SSO connection in Scalar:

1. Navigate to [Team > Security](https://dashboard.scalar.com/team/security) in Scalar
2. Under **Advanced Security**, enable **Single Sign-On**
3. Click **Setup Connection** to create a new SSO connection

This will provide you with the values needed for the next step.

## 5. Configure Basic SAML Settings

Configure the Basic SAML Configuration with the following service provider details:

### Basic SAML Configuration

![](../../../assets/sso/microsoft-entra-id/microsoft-basic-saml-configuration.png)

| Field                                      | Value                             |
| ------------------------------------------ | --------------------------------- |
| Identifier (Entity ID)                     | `https://identity.scalar.com`     |
| Reply URL (Assertion Consumer Service URL) | `https://identity.scalar.com/acs` |
| Sign on URL (Optional)                     | "Login URL" from Scalar           |
| Relay State (Optional)                     | "Generate Relay State" in Scalar  |

## 6. Copy IdP Details to Scalar

Copy the IdP details from Microsoft Entra ID into Scalar:

| Scalar                     | Microsoft Entra ID       |
| -------------------------- | ------------------------ |
| Login URL                  | SSO URL                  |
| Microsoft Entra Identifier | Identity Provider Issuer |
| Certificate (Base64)       | X.509 Certificate        |

### SAML Certificates

![](../../../assets/sso/microsoft-entra-id/microsoft-saml-certificates.png)

### Service Provider Details

![](../../../assets/sso/microsoft-entra-id/scalar-service-provider-details.png)

## 7. Set the Signing Option

In the **SAML Certificates** card, click **Edit** and set **Signing Option** to **Sign SAML response and assertion**. Leave **Signing Algorithm** at SHA-256 and save.

> Microsoft Entra ID defaults to **Sign SAML assertion**. Once token encryption is enabled in the next step, that default causes Scalar to reject the sign-in with "Invalid SAML signature state". Scalar needs the SAML response to be signed as well as the assertion.

## 8. Enable Token Encryption

Scalar requires token encryption for SAML assertions. Without it, sign-in attempts are sent back to the Scalar login page. Download the encryption certificate from Scalar and import it into Microsoft Entra ID under **Token encryption**:

### Import the Encryption Certificate

![](../../../assets/sso/microsoft-entra-id/microsoft-import-certificate.png)

### Configure Token Encryption

![](../../../assets/sso/microsoft-entra-id/microsoft-token-encryption.png)

### Verify Token Encryption is Enabled

![](../../../assets/sso/microsoft-entra-id/microsoft-token-encryption-enabled.png)

## Done!

Your organization is now ready to use Scalar SSO with Microsoft Entra ID! If you run into any issues, double-check your settings - or just [reach out to our support team](mailto:support@scalar.com), we're here to help!

## Troubleshooting

* **"Invalid SAML signature state" after signing in with Microsoft** - the **Signing Option** in the SAML Certificates card is still set to **Sign SAML assertion**. Change it to **Sign SAML response and assertion** (step 7).
* **Sent back to the Scalar login page without an error** - token encryption is not enabled for the application, or the wrong certificate was imported. Re-check step 8.
* **Users cannot be matched to their Scalar account** - the **Unique User Identifier (Name ID)** claim under **Attributes & Claims** must be the user's email address (`user.mail` or `user.userprincipalname`).
