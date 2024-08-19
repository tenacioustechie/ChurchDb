import { Amplify } from "aws-amplify";

export default function ConfigureAuth() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: "ap-southeast-2_EDL5NDs36",
        userPoolClientId: "5qupvd6nqsr2nkd34ffcb5efu6",
        identityPoolId: "ap-southeast-2:46a7d6ea-ef9d-4216-82d7-18dfd98ae11c",
        loginWith: {
          email: true,
        },
        signUpVerificationMethod: "code",
        userAttributes: {
          email: {
            required: true,
          },
        },
        allowGuestAccess: true,
        passwordFormat: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialCharacters: true,
        },
      },
    },
  });
}
