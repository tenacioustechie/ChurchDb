// Load the AWS SDK for Node.js
import * as AWS from "aws-sdk";
import { EnvVarKeys } from "../envVarKeys";

export interface ResponseItem {
  pk: string;
  sk: string;
  pcid: string;
  response: string;
  timestamp: string;
  email: string;
  answers: ResponseAnswer[];
}
export interface ResponseAnswer {
  question: string;
  answer: string;
}

export class ResponseDb {
  ddb: AWS.DynamoDB;
  tableName: string;
  constructor() {
    // Create the DynamoDB service object
    this.ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
    this.tableName = process.env[EnvVarKeys.ChurchContactResponseTableName] ?? "UnknownTableName";
  }

  async putItem(params) {
    return this.ddb.putItem(params).promise();
  }
}

/* ddb.putItem(params, function (err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data);
  }
});/* */
