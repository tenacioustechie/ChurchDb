import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
// import * as CertificateManager from "aws-cdk-lib/aws-certificatemanager";
// import * as Route53 from "aws-cdk-lib/aws-route53";
// import * as Route53Targets from "aws-cdk-lib/aws-route53-targets";
// import * as ApiGateway from "aws-cdk-lib/aws-apigateway";

// import * as ELBv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
// import { StageInfo } from "../config/stage-config";
import * as Cognito from "aws-cdk-lib/aws-cognito";

export class PCAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    var cognitoUserPool = new Cognito.UserPool(this, "PCAppUserPool", {
      userPoolName: `PCAppUserPool`,
      selfSignUpEnabled: false,
      signInAliases: { email: true, username: false, phone: false },
      passwordPolicy: { minLength: 12, requireLowercase: true, requireDigits: true, requireSymbols: false, requireUppercase: true },
      autoVerify: { email: true },
      accountRecovery: Cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: { emailStyle: Cognito.VerificationEmailStyle.CODE },
      mfa: Cognito.Mfa.OPTIONAL,
      mfaSecondFactor: { sms: false, otp: true },
      standardAttributes: { email: { required: true, mutable: false }, phoneNumber: { required: false, mutable: false } },
      customAttributes: { userType: new Cognito.StringAttribute({ mutable: true }) },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cfnUserPoolUser = new Cognito.CfnUserPoolUser(this, "PCAppDeafultAdminUser", {
      userPoolId: cognitoUserPool.userPoolId,
      // the properties below are optional
      // clientMetadata: {
      //   clientMetadataKey: "clientMetadata",
      // },
      // desiredDeliveryMediums: ["desiredDeliveryMediums"],
      // forceAliasCreation: false,
      // messageAction: "RESEND",
      // userAttributes: [
      //   {
      //     name: "name",
      //     value: "admin",
      //   },
      // ],
      username: "brian@millsit.com",
      forceAliasCreation: true,
      desiredDeliveryMediums: ["EMAIL"],
      // validationData: [
      //   {
      //     name: "name",
      //     value: "value",
      //   },
      // ],
    });

    // example resource
    // const queue = new sqs.Queue(this, 'PcAppQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
