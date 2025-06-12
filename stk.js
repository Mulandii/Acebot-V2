const axios = require("axios");
const payments = {};

async function sendSTKPush(phone, amount, txid) {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const password = Buffer.from(
    `${process.env.BUSINESS_SHORTCODE}${process.env.PASSKEY}${timestamp}`
  ).toString("base64");

  const { data: tokenData } = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      auth: {
        username: process.env.CONSUMER_KEY,
        password: process.env.CONSUMER_SECRET,
      },
    }
  );

  const accessToken = tokenData.access_token;

  await axios.post(
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    {
      BusinessShortCode: process.env.BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.BUSINESS_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: `${process.env.BASE_URL}/callback`,
      AccountReference: txid,
      TransactionDesc: `Payment of KES ${amount}`,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  payments[txid] = { status: "pending", phone, amount };
  return { txid };
}

module.exports = { sendSTKPush, payments };
