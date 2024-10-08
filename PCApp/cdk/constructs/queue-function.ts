import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_sqs as sqs } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export interface QueueFunctionProps extends cdk.StackProps {
  queue: sqs.Queue;
  functionEntry: string;
  handler: string;
  envVariables?: { [key: string]: string };
}

export class QueueFunction extends Construct {
  public function: NodejsFunction;

  constructor(scope: Construct, id: string, props: QueueFunctionProps) {
    super(scope, id);

    this.function = new NodejsFunction(this, "QueueFunction", {
      runtime: Runtime.NODEJS_20_X,
      entry: props.functionEntry,
      handler: props.handler,
      environment: props.envVariables,
      bundling: {
        preCompilation: true,
      },
    });

    props.queue.grantConsumeMessages(this.function);
    this.function.addEventSource(new SqsEventSource(props.queue));
  }
}
