import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as ApiGateway from "aws-cdk-lib/aws-apigateway";
//import { aws_sqs as sqs } from "aws-cdk-lib";

export class SurveyWebhook extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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

    // webhook
    const webhookApi = new ApiGateway.RestApi(this, "PcAppSurveyWebhookApi", {
      restApiName: "PCApp Webhook API",
      description: "This API receives survey results from the PCApp survey form",
    });

    const webhookIntegration = new ApiGateway.AwsIntegration({
      service: "sqs",
      path: surveyWebhookQueue.queueUrl,
      integrationHttpMethod: "POST",
    });
    webhookApi.root.addResource("responslyPC2024").addMethod("POST", webhookIntegration);
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
  }
}
