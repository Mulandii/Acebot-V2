const express = require("express");
const router = express.Router();
const { sendSTKPush, payments } = require("./stk");

// 🔁 Payment Status Check
router.get("/payment-status", (req, res) => {
  const txid = req.query.txid;
  if (!txid || !payments[txid]) {
    return res.status(404).json({ error: "Transaction not found" });
  }
  res.json(payments[txid]);
});

// 📥 M-Pesa Callback
router.post("/callback", express.json(), (req, res) => {
  const stk = req.body?.Body?.stkCallback;
  const txid = stk?.AccountReference;

  if (!stk || !txid) return res.sendStatus(400);

  const code = stk.ResultCode;
  const meta = stk.CallbackMetadata?.Item || [];

  payments[txid] = {
    status: code === 0 ? "success" : "failed",
    reason: code === 0 ? undefined : stk.ResultDesc,
    phone: meta.find(i => i.Name === "PhoneNumber")?.Value,
    amount: meta.find(i => i.Name === "Amount")?.Value,
  };

  console.log("📥 Callback:", payments[txid]);
  res.sendStatus(200);
});

// 🧾 STK Push Request from frontend
router.post("/stk-push", express.json(), async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: "Phone and amount are required" });
  }

  try {
    const txid = `TX${Date.now()}`;
    await sendSTKPush(phone, amount, txid);
    res.json({ success: true, txid });
  } catch (err) {
    console.error("❌ STK error:", err.response?.data || err.message);
    res.status(500).json({ error: "STK push failed" });
  }
});

module.exports = router;

