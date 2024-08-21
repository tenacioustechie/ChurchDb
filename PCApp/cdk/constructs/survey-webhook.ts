import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as ApiGateway from "aws-cdk-lib/aws-apigateway";
import { Effect, Policy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
//import { aws_sqs as sqs } from "aws-cdk-lib";

export class SurveyWebhook extends Construct {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);

    // survey webhook dead letter queue
    const surveyWebhookDlq = new sqs.Queue(this, "PcAppSurveyResultsDLQ", {
      visibilityTimeout: cdk.Duration.seconds(300),
      // redriveAllowPolicy: {
      //   redrivePermission: sqs.RedrivePermission.DENY_ALL,
      // },
    });

    // survey webhook queue
    const surveyWebhookQueue = new sqs.Queue(this, "PcAppSurveyResultsQueue", {
      visibilityTimeout: cdk.Duration.seconds(300),
      redriveAllowPolicy: {
        sourceQueues: [surveyWebhookDlq],
      },
    });

    // Create policy to allow api gateway to send message to sqs
    const credentialsRole = new Role(this, "webhook-api-role", {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
    });
    // const policy = new Policy(this, "webhook-api-send-message-policy", {
    //   statements: [
    //     new PolicyStatement({
    //       actions: ["sqs:SendMessage"],
    //       effect: Effect.ALLOW,
    //       resources: [surveyWebhookQueue.queueArn],
    //     }),
    //   ],
    // });
    // credentialsRole.attachInlinePolicy(policy);
    surveyWebhookQueue.grantSendMessages(credentialsRole);

    const webhookIntegration = new ApiGateway.AwsIntegration({
      service: "sqs",
      path: `${process.env.CDK_DEFAULT_ACCOUNT}/${surveyWebhookQueue.queueName}`,
      //path: surveyWebhookQueue.queueUrl,
      integrationHttpMethod: "POST",
      options: {
        credentialsRole: credentialsRole,
        requestParameters: {
          "integration.request.header.Content-Type": "'application/x-www-form-urlencoded'",
        },
        // requestTemplates: {
        //   "application/json": `Action=SendMessage&MessageBody=$util.urlEncode($input.body)`,
        // },
        requestTemplates: { "application/json": "Action=SendMessage&MessageBody=$input.body" },
        //passthroughBehavior: ApiGateway.PassthroughBehavior.NEVER,
        integrationResponses: [
          {
            statusCode: "200",
            responseTemplates: {
              "application/json": `{"statusCode": 200, "message": "Success"}`,
            },
          },
          {
            statusCode: "400",
            responseTemplates: {
              "application/json": `{"statusCode": 400, "message": "Bad Request"}`,
            },
          },
          {
            statusCode: "500",
            responseTemplates: {
              "application/json": `{"statusCode": 500, "message": "Internal Server Error"}`,
            },
          },
        ],
      },
    });

    // webhook API
    const webhookApi = new ApiGateway.RestApi(this, "PcAppSurveyWebhookApi", {
      restApiName: "PCApp Webhook API",
      description: "This API receives survey results from the PCApp survey form",
    });
    // add post method
    webhookApi.root.addResource("responslyPC2024").addMethod("POST", webhookIntegration, {
      methodResponses: [
        {
          statusCode: "200",
          // responseModels: {
          //   "application/json": `{"statusCode": 200, "message": "Success"}`,
          // },
        },
        {
          statusCode: "400",
          // responseModels: {
          //   "application/json": `{"statusCode": 400, "message": "Bad Request"}`,
          // },
        },
        {
          statusCode: "500",
          // responseModels: {
          //   "application/json": `{"statusCode": 500, "message": "Internal Server Error"}` as IModel,
          // },
        },
      ],
    });
    //surveyWebhookQueue.grantSendMessages(webhookIntegration);

    // const plan = webhookApi.addUsagePlan("UsagePlan", {
    //   name: "Easy",
    //   throttle: {
    //     rateLimit: 10,
    //     burstLimit: 2,
    //   },
    // });
    // const key = webhookApi.addApiKey("ApiKey");
    // plan.addApiKey(key);

    // lambda
    // new NodejsFunction(this, "ProcessSurveyResults", {
    //   entry: "/lambda/process-survey-results.ts", // accepts .js, .jsx, .cjs, .mjs, .ts, .tsx, .cts and .mts files
    //   handler: "handler", // defaults to 'handler'
    //   timeout: cdk.Duration.seconds(120),
    // });
  }
}
