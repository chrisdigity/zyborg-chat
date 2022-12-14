/* eslint-env node, es6 */
/* eslint-disable no-console */

const { Client, GatewayIntentBits } = require('discord.js');
const Zyborg = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

Zyborg.on("ready", async () => {
  try {
    const { ChatGPTAPI, getOpenAIAuth } = await import('chatgpt');
    const openAIAuth = await getOpenAIAuth({
      email: process.env.OPENAI_EMAIL,
      password: process.env.OPENAI_PASSWORD
    });
    const api = new ChatGPTAPI({ ...openAIAuth });
    await api.ensureAuth();

    const conversation = api.getConversation();
    Zyborg.on("messageCreate", async function (message) {
      /* pre-checks (not-bot, is-mentioned, not lengthy) */
      if (message.author.bot || !message.mentions.has(Zyborg.user.id)) return;
      if (message.mentions.members.size > 1) {
        return message.reply("*mentioning discord members is forbidden*");
      }
      message.channel.sendTyping().catch(console.error);
      conversation.sendMessage(
        message.content.replace(/<@([0-9]+)>/g, ''), { timeoutMs: 60000 }
      ).then(response => message.channel.send(response)).catch(error => {
        console.error(error);
        message.channel.send(
          "*an internal error occurred :(*"
        ).catch(console.error);
      });
    });
    console.log("ready");
  } catch (error) {
    console.error("Initialization error", error);
    process.exit(1);
  }
});

// clean shutdown and restart on SIGTERM
process.once('SIGTERM', () => {
  console.log('SIGTERM detected. Restarting...');
  Zyborg.channels.fetch(CHID_SPAM).then(channel => {
    channel.send('```SIGTERM detected. Restarting...```').catch(console.error);
  }).catch(console.error);
  // destroy bot, and process
  Zyborg.destroy();
  process.exit(101);
});

// bot logins
Zyborg.login(process.env.ZYBORG_TOKEN);
