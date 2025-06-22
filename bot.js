const { sendSTKPush } = require('./stk');
const sessions = {};

module.exports = function (client) {
  client.onMessage(async (message) => {
    const user = message.from;
    const text = message.body.trim().toLowerCase();

    if (!sessions[user]) sessions[user] = {};
    const session = sessions[user];

    if (!session.started) {
      if (text === '/start') {
        session.started = true;
        client.sendText(
          user,
          `📦 Choose a package:\n1. 55 KSH - 1.25GB till midnight\n2. 20 KSH - 250MB (24hrs)\n3. 23 KSH - 45 mins valid for 3hrs (can buy many)`
        );
        session.step = 'choose_package';
      }
      return;
    }

    if (session.step === 'choose_package') {
      if (['1', '2', '3'].includes(text)) {
        const packages = {
          '1': '1. 55 KSH - 1.25GB till midnight',
          '2': '2. 20 KSH - 250MB (24hrs)',
          '3': '3. 23 KSH - 45 mins valid for 3hrs (can buy many)',
        };
        session.package = text;
        session.amount = { '1': 55, '2': 20, '3': 23 }[text];
        client.sendText(
          user,
          `✅ You chose:\n${packages[text]}\n\nPress 1 to continue or 2 to choose again`
        );
        session.step = 'confirm_package';
      } else {
        client.sendText(user, `❌ Invalid option. Reply 1, 2 or 3.`);
      }
    }

    else if (session.step === 'confirm_package') {
      if (text === '1') {
        client.sendText(user, `📱 Enter the phone number to pay with (07XXXXXXXX):`);
        session.step = 'enter_number';
      } else if (text === '2') {
        session.step = 'choose_package';
        client.sendText(
          user,
          `📦 Choose a package:\n1. 55 KSH - 1.25GB till midnight\n2. 20 KSH - 250MB (24hrs)\n3. 23 KSH - 45 mins valid for 3hrs (can buy many)`
        );
      } else {
        client.sendText(user, `❌ Reply 1 to continue or 2 to change your selection.`);
      }
    }

    else if (session.step === 'enter_number') {
      if (!/^07\d{8}$/.test(text)) {
        client.sendText(user, `❌ Invalid phone format. Use 07XXXXXXXX.`);
      } else {
        const phone = text.replace(/^0/, '254');
        session.phone = phone;
        session.step = 'processing';

        client.sendText(user, `🔄 Sending STK push to ${phone} for KES ${session.amount}...`);

        try {
          const txid = `TX${Date.now()}`;
          await sendSTKPush(phone, session.amount, txid);
          client.sendText(user, `✅ STK Push sent to ${phone}.\n📡 Awaiting confirmation... You’ll get your package within 1 minute after payment.`);
        } catch (err) {
          console.error("❌ STK error:", err.response?.data || err.message);
          client.sendText(user, `❌ Failed to initiate payment. Try again later.`);
        }

        delete sessions[user]; // clear session after
      }
    }
  });
};

