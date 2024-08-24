import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_sqs as sqs } from "aws-cdk-lib";
import * as ApiGateway from "aws-cdk-lib/aws-apigateway";
import { Effect, Policy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { ARecord, CnameRecord, IHostedZone, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { Certificate, CertificateValidation, ICertificate } from "aws-cdk-lib/aws-certificatemanager";
//import { aws_sqs as sqs } from "aws-cdk-lib";

export interface WebhookQueueProps extends cdk.StackProps {
  webhookUriPath: string;
  domainNamePrefix?: string;
  dnsZone?: IHostedZone;
}

export class WebhookQueue extends Construct {
  public queue: sqs.Queue;
  public deadLetterQueue: sqs.Queue;
  public webhookApiGw: ApiGateway.RestApi;

  constructor(scope: Construct, id: string, props: WebhookQueueProps) {
    super(scope, id);

    // survey webhook dead letter queue
    this.deadLetterQueue = new sqs.Queue(this, "WebhookDLQ", {
      deliveryDelay: cdk.Duration.seconds(3),
      // contentBasedDeduplication: true, // MUST BE FIFO to do this
      // fifo: false,
      visibilityTimeout: cdk.Duration.seconds(120),
      // redriveAllowPolicy: {
      //   redrivePermission: sqs.RedrivePermission.DENY_ALL,
      // },
    });

    // survey webhook queue
    this.queue = new sqs.Queue(this, "WebhookQueue", {
      deliveryDelay: cdk.Duration.seconds(3),
      // contentBasedDeduplication: true, // MUST BE FIFO to do this
      // fifo: false,
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: {
        maxReceiveCount: 1,
        queue: this.deadLetterQueue,
      },
      redriveAllowPolicy: {
        sourceQueues: [this.deadLetterQueue],
      },
    });

    // Create policy to allow api gateway to send message to sqs
    const webhookRole = new Role(this, "webhook-api-role", {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
    });
    this.queue.grantSendMessages(webhookRole);

    const webhookIntegration = new ApiGateway.AwsIntegration({
      service: "sqs",
      path: `${process.env.CDK_DEFAULT_ACCOUNT}/${this.queue.queueName}`,
      integrationHttpMethod: "POST",
      options: {
        credentialsRole: webhookRole,
        requestParameters: {
          "integration.request.header.Content-Type": "'application/x-www-form-urlencoded'",
        },
        requestTemplates: { "application/json": "Action=SendMessage&MessageBody=$input.body" },
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
    this.webhookApiGw = new ApiGateway.RestApi(this, "WebhookApi", {
      // name will be auto generated based on stack name and properties
      //restApiName: "WebhookAPI",
      description: "Rest API used for incoming webhooks",
    });
    // add post method
    this.webhookApiGw.root.addResource(props.webhookUriPath).addMethod("POST", webhookIntegration, {
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

    // add custom domain name if provided
    if (props.domainNamePrefix && props.dnsZone) {
      const apiDomainName = `${props.domainNamePrefix}.${props.dnsZone.zoneName}`;
      console.log(`Adding Domain name: ${apiDomainName}`);
      console.log(`RestApiId:   ${this.webhookApiGw.restApiId}`);
      console.log(`RestApiName: ${this.webhookApiGw.restApiName}`);
      const apiCertificate = new Certificate(this, "WebhookApiCertificate", {
        domainName: apiDomainName,
        validation: CertificateValidation.fromDns(props.dnsZone),
      });
      this.webhookApiGw.addDomainName(apiDomainName, {
        domainName: apiDomainName,
        securityPolicy: ApiGateway.SecurityPolicy.TLS_1_2,
        certificate: apiCertificate,
      });
      const dnsARecord = new route53.ARecord(this, "WebhookApiAliasRecord", {
        recordName: props.domainNamePrefix,
        zone: props.dnsZone,
        target: route53.RecordTarget.fromAlias(new targets.ApiGateway(this.webhookApiGw)),
        ttl: cdk.Duration.minutes(5),
      });
    } else {
      console.log("No domain name prefix or dns zone provided, skipping CNAME record creation");
    }

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
