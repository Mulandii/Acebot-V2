const express = require("express");
const router = express.Router();
const { payments } = require("./stk");

router.get("/payment-status", (req, res) => {
  const txid = req.query.txid;
  if (!txid || !payments[txid]) {
    return res.status(404).json({ error: "Transaction not found" });
  }
  res.json(payments[txid]);
});

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

module.exports = router;
