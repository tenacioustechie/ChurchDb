import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
// import * as CertificateManager from "aws-cdk-lib/aws-certificatemanager";
import * as Route53 from "aws-cdk-lib/aws-route53";
import * as Route53Targets from "aws-cdk-lib/aws-route53-targets";
import * as ApiGateway from "aws-cdk-lib/aws-apigateway";

// import * as ELBv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
// import { StageInfo } from "../config/stage-config";
import * as Cognito from "aws-cdk-lib/aws-cognito";
import * as S3 from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import * as CloudFront from "aws-cdk-lib/aws-cloudfront";
import { SurveyWebhook } from "./survey-webhook";
import { WebhookQueue } from "./webhook-queue";
import { QueueFunction } from "./queue-function";
import { DnsZone } from "./dns-zone";
import { Lambda } from "aws-cdk-lib/aws-ses-actions";
import { Function } from "aws-cdk-lib/aws-lambda";
import path = require("path");
import { PeopleCountTables } from "./people-count-tables";
import { EnvVarKeys } from "../../lambda/envVarKeys";

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

    const s3CorsRule: S3.CorsRule = {
      allowedMethods: [S3.HttpMethods.GET, S3.HttpMethods.HEAD],
      allowedOrigins: ["*"],
      allowedHeaders: ["*"],
      maxAge: 300,
    };

    const s3Bucket = new S3.Bucket(this, "S3Bucket", {
      //bucketName: "hosting-pcapp",
      blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
      accessControl: S3.BucketAccessControl.PRIVATE,
      cors: [s3CorsRule],
    });
    const oai = new CloudFront.OriginAccessIdentity(this, "OAI");
    s3Bucket.grantRead(oai);

    const myCloudfrontDistro = new CloudFront.CloudFrontWebDistribution(this, "PcAppCFDistro", {
      comment: "PcApp CloudFront Distribution",
      defaultRootObject: "index.html",
      priceClass: CloudFront.PriceClass.PRICE_CLASS_ALL,
      viewerProtocolPolicy: CloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      // errorConfigurations: [
      //   {
      //     errorCode: 403,
      //     responseCode: 200,
      //     responsePagePath: "/index.html",
      //   },
      //   {
      //     errorCode: 404,
      //     responseCode: 200,
      //     responsePagePath: "/index.html",
      //   },
      // ],
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: s3Bucket,
            originAccessIdentity: oai,
          },
          behaviors: [{ isDefaultBehavior: true }, { pathPattern: "/*", allowedMethods: CloudFront.CloudFrontAllowedMethods.GET_HEAD }],
        },
      ],
    });

    const dnsZone = new DnsZone(this, "PCAppDnsZone", { zoneName: "pcapp.peoplecount.au", domainName: "pcapp.peoplecount.au" });
    console.log("DnsZone name: " + dnsZone.dnsZone.zoneName);

    // Deploy web content to S3 Bucket
    const deployment = new BucketDeployment(this, "DeployWithInvalidation", {
      sources: [Source.asset("./../frontend/church-db-app/build")],
      destinationBucket: s3Bucket,
      distribution: myCloudfrontDistro,
      distributionPaths: ["/*"],
    });

    // Responslfy Webhook Resources
    const responslyWebhook = new WebhookQueue(this, "PCAppResponslyWebhook", {
      webhookUriPath: "ResponslyWebhook",
      dnsZone: dnsZone.dnsZone,
      domainNamePrefix: "responslywebhook",
    });

    // DynamoDB Table
    var tables = new PeopleCountTables(this, "PCAppDynamoDbTables", {});

    console.log("Directory path: " + __dirname);
    console.log("Lambda path: " + path.join(__dirname, "../../lambda/process-survey-results.ts"));
    var queueFunction = new QueueFunction(this, "QueueFunction", {
      queue: responslyWebhook.queue,
      functionEntry: path.join(__dirname, "../../lambda/process-survey-results.ts"),
      handler: "handler",
      envVariables: {
        [EnvVarKeys.SmtpPassword]: "hltvvhfqsnvfxfxf",
        [EnvVarKeys.ChurchContactResponseTableName]: tables.churchContactResponseTable.tableName,
      },
    });
    tables.churchContactResponseTable.grantReadWriteData(queueFunction.function);
  }
}
