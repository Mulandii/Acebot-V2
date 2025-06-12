require("dotenv").config();
const express = require("express");
const { create } = require("venom-bot");
const routes = require("./routes");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(routes);

create({
  session: "mpesa-bot",
  multidevice: true,
})
  .then(client => {
    require("./bot")(client);
    console.log("✅ Venom bot started");
  })
  .catch(console.error);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
