const { sendSTKPush, payments } = require("./stk");
const sessions = {};

module.exports = function (client) {
  client.onMessage(async (msg) => {
    const from = msg.from;
    const body = msg.body.trim().toLowerCase();
    if (!sessions[from]) sessions[from] = {};

    const session = sessions[from];

    if (!session.step) {
      if (body.includes("pay")) {
        session.step = "awaiting_phone";
        return client.sendText(from, "📱 Enter your phone number (07XXXXXXXX):");
      }
      return client.sendText(from, "👋 Send 'pay' to start a payment.");
    }

    if (session.step === "awaiting_phone") {
      if (!/^07\d{8}$/.test(body)) {
        return client.sendText(from, "❌ Invalid format. Use 07XXXXXXXX.");
      }
      session.phone = "254" + body.slice(1);
      session.step = "awaiting_amount";
      return client.sendText(from, "💰 Enter the amount to pay (KES):");
    }

    if (session.step === "awaiting_amount") {
      const amount = parseInt(body);
      if (isNaN(amount) || amount <= 0) {
        return client.sendText(from, "❌ Enter a valid amount.");
      }
      const txid = Date.now().toString();
      try {
        await sendSTKPush(session.phone, amount, txid);
        client.sendText(from, `✅ STK prompt sent to ${session.phone}`);
      } catch {
        client.sendText(from, "❌ Failed to send payment prompt.");
      }
      delete sessions[from];
    }
  });
};
