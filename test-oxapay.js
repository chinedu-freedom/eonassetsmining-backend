import dotenv from 'dotenv';
dotenv.config();

const OXAPAY_MERCHANT_KEY = process.env.OXAPAY_MERCHANT_KEY;
console.log("Merchant Key defined:", !!OXAPAY_MERCHANT_KEY);

async function testOxaPay() {
  try {
    const invoiceRes = await fetch("https://api.oxapay.com/merchants/request/whitelabel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: OXAPAY_MERCHANT_KEY,
        amount: 100,
        payCurrency: "USDT",
        network: "trc20",
        feePaidByPayer: 0,
        callbackUrl: `https://api.polychainapp.com/api/users/oxapay-webhook`,
        description: `Polychainapp Test Deposit`,
      }),
    });
    const json = await invoiceRes.json();
    console.log("OxaPay API Response:", json);
  } catch (err) {
    console.error("OxaPay fetch error:", err);
  }
}
testOxaPay();
