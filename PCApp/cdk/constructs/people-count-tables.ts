import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_sqs as sqs } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as DynamoDb from "aws-cdk-lib/aws-dynamodb";

export interface PeopleCountTablesProps extends cdk.StackProps {}

export class PeopleCountTables extends Construct {
  public churchContactResponseTable: cdk.aws_dynamodb.TableV2;

  constructor(scope: Construct, id: string, props: PeopleCountTablesProps) {
    super(scope, id);

    this.churchContactResponseTable = new DynamoDb.TableV2(this, "ChurchContactResponseTable", {
      partitionKey: { name: "pk", type: DynamoDb.AttributeType.STRING },
      sortKey: { name: "sk", type: DynamoDb.AttributeType.STRING },
      globalSecondaryIndexes: [{ indexName: "gsi1", partitionKey: { name: "gsi1pk", type: DynamoDb.AttributeType.STRING }, sortKey: { name: "gsi1sk", type: DynamoDb.AttributeType.STRING } }],
      billing: DynamoDb.Billing.onDemand(),
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });
  }
}
