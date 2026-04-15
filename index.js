require('dotenv').config()

// Reações
async function react(message, emoji) {
  try {
    return await message.react(emoji);
  } catch {
    return null;
  }
}

async function removeReaction(reaction) {
  if (!reaction) return;
  try {
    await reaction.remove();
  } catch {}
}

// Constantes
const { PromptPadrao } = require('./constants');

// Chamar I.A.
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

const { Client, GatewayIntentBits } = require('discord.js')

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: ['CHANNEL']
})

client.on('clientReady', () => {
  console.log('Lia está online!')
})

client.on('messageCreate', async (message) => {
  if (message.author.bot) return

  // Comando suporte pra chamar no servidor
  if (message.content === "!suporte") {

    let correctReaction;

    try {
      correctReaction = await react(message, '✅');
      await message.author.send("Olá! Sou a Lia,Como posso te ajudar?")
    } catch (error) {

      await removeReaction(correctReaction);

      message.reply("Não consegui te enviar mensagem privada. Ative seu DM 😢");
    }

    return
  }

  // Caso seja mensagem privada
  if (!message.guild) {

    let loadingReaction;
    let correctReaction;

    try {
      loadingReaction = await react(message, '⏳');

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: PromptPadrao
          },
          {
            role: "user",
            content: message.content
          }
        ]
      });

      await removeReaction(loadingReaction);

      correctReaction = await react(message, '✅');

      await message.reply(response.choices[0].message.content);

    } catch (error) {
      console.error(error)

      await removeReaction(loadingReaction);
      await removeReaction(correctReaction);

      await react(message, '❌');
      message.reply("Ocorreu um erro ao falar com a IA 😢")
    }

    return
  }

  // Resposta quando alguém mencionar no servidor
  if (message.mentions.has(client.user)) {

    let correctReaction;

    try {

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é a Lia, assistente amigável do Discord."
          },
          {
            role: "user",
            content: message.content
          }
        ]
      });

      correctReaction = await react(message, '✅');

      await message.reply(response.choices[0].message.content);

    } catch (error) {
      console.error(error)

      await removeReaction(correctReaction);

      await react(message, '❌');

      message.reply("Erro ao responder 😢")
    }

  }

})

client.login(process.env.DISCORD_TOKEN)