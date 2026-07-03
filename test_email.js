import 'dotenv/config';
import { sendEmail } from './src/lib/zohoMailer.js';

async function testEmail() {
  console.log("Testing Zoho Mailer...");
  console.log("ACCOUNT ID:", process.env.ZOHO_MAIL_ACCOUNT_ID ? "SET" : "MISSING");
  console.log("FROM EMAIL:", process.env.ZOHO_FROM_EMAIL);
  
  const result = await sendEmail({
    to: "test@example.com",
    subject: "Test Email from Backend",
    html: "<p>This is a test.</p>"
  });
  
  console.log("Result:", result);
}

testEmail().catch(console.error);
