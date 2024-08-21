import { Handler } from "aws-lambda";
import { SQSEvent, Context, SQSHandler, SQSRecord } from "aws-lambda";
const nodemailer = require("nodemailer");

export const handler: SQSHandler = async (event: SQSEvent, context: Context): Promise<void> => {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));
  for (const message of event.Records) {
    await processMessageAsync(message);
  }
  console.info("done");
};

async function processMessageAsync(message: SQSRecord): Promise<any> {
  try {
    console.log(`Processing message ${message.body}`);
    await send365Email("admin@peoplecount.au", "brian@millsit.com", "Subject", `<p><i>Hello World</i></p><p>${message.body}</p>`, `Hello World \n\n${message.body}`);
    await Promise.resolve(1); //Placeholder for actual async work
  } catch (err) {
    console.error("An error occurred");
    throw err;
  }
}

// Set this from config or environment variable.
const PASSWORD = "hltvvhfqsnvfxfxf";

async function send365Email(from: string, to: string, subject: string, html: string, text: string) {
  try {
    const transportOptions = {
      host: "smtp-mail.outlook.com", // "smtp.office365.com",
      port: "587",
      auth: { user: from, pass: PASSWORD },
      secureConnection: true,
      tls: { ciphers: "SSLv3" },
    };
    const mailTransport = nodemailer.createTransport(transportOptions);

    await mailTransport.sendMail({
      from,
      to,
      replyTo: from,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error(`send365Email: An error occurred:`, err);
  }
}
