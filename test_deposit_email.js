import 'dotenv/config';
import { sendDepositNotificationEmail } from './src/lib/mailer.js';

async function testEmail() {
  console.log("Testing deposit notification email...");
  
  try {
    await sendDepositNotificationEmail({
      email: "chinedufreedom10@gmail.com",
      name: "Chinedu",
      crypto: "BTC (Bitcoin)",
      amount: 1500,
      status: "approved",
      date: new Date()
    });
    console.log("Deposit notification email sent successfully!");
  } catch (error) {
    console.error("Failed to send deposit email:", error);
  }
}

testEmail().catch(console.error);
