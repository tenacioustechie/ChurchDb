import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as Route53 from "aws-cdk-lib/aws-route53";
import { IVpc } from "aws-cdk-lib/aws-ec2";

export interface DnsZoneProps extends cdk.StackProps {
  zoneName: string;
  // TODO: allow optionally specify an existing zone by id
  zoneId?: string;
  isPrivateZone?: boolean;
  domainName: string;
  vpc?: IVpc;
}

export class DnsZone extends Construct {
  public dnsZone: Route53.HostedZone;

  constructor(scope: Construct, id: string, props: DnsZoneProps) {
    super(scope, id);

    if (props.isPrivateZone) {
      if (!props.vpc) {
        throw Error("Private zones require VPC to be provided");
      }
      this.dnsZone = new Route53.PrivateHostedZone(this, "DnsZone", {
        zoneName: props.zoneName,
        vpc: props.vpc,
      });
    } else {
      this.dnsZone = new Route53.PublicHostedZone(this, "DnsZone", {
        zoneName: props.zoneName,
      });
    }
    // new Route53.CnameRecord(this, "CnameRecord", {
    //   zone: this.dnsZone,
    //   recordName: props.recordName,
    //   domainName: props.domainName,
    // });
  }
}
