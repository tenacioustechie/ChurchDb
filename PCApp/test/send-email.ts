import { send365Email } from "../lambda/process-survey-results";

async function testSendEmail() {
  await send365Email("admin@peoplecount.au", "brian@millsit.com", "Test Email", "<p><i>Hello World</i></p><p>This is a test email</p>", "Hello World \n\nThis is a test email");
}
console.log("Sending email");
var result = testSendEmail();
console.log("Done");
