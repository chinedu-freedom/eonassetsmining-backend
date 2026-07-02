import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const trackId = process.argv[2];
const amount = process.argv[3];
const port = process.env.PORT || 3001;

if (!trackId || !amount) {
  console.log("Usage: node simulate-payment.js <trackId> <amount>");
  console.log("Example: node simulate-payment.js DEP-1234 100");
  process.exit(1);
}

const payload = {
  status: "Paid",
  trackId: trackId,
  amount: amount,
  currency: "USDT"
};

const payloadString = JSON.stringify(payload);
const headers = {
  'Content-Type': 'application/json'
};

if (process.env.OXAPAY_MERCHANT_KEY) {
  const hmac = crypto.createHmac("sha512", process.env.OXAPAY_MERCHANT_KEY);
  const signature = hmac.update(payloadString).digest("hex");
  headers['x-oxapay-signature'] = signature;
}

console.log(`Simulating OxaPay confirmed payment for ${amount} USDT`);
console.log(`Track ID: ${trackId}`);
console.log(`Sending webhook to http://localhost:${port}/api/users/oxapay-webhook...\n`);

fetch(`http://localhost:${port}/api/users/oxapay-webhook`, {
  method: 'POST',
  headers: headers,
  body: payloadString
})
.then(res => res.json())
.then(data => {
  console.log("✅ Webhook response:", data);
  console.log("\nIf you see { ok: true } and the status was Paid, the user balance should now be credited!");
})
.catch(err => {
  console.error("❌ Error sending webhook:", err);
});
