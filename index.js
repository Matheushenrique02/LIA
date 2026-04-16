require('dotenv').config()

// Constantes
const { PromptPadrao } = require('./constants');
const { logError, logIA } = require('./logger');
// ----------------------------------- //

// Reações
async function removeReaction(reaction, client) {
  if (!reaction) return;

  try {
    await reaction.users.remove(client.user.id);
  } catch (err) {
    console.error("Erro ao remover reação:", err);
  }
}

async function react(message, emoji) {
  try {
    return await message.react(emoji);
  } catch {
    return null;
  }
}
// ----------------------------------- //

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
// ----------------------------------- //

// Comando suporte pra chamar no servidor
  if (message.content === "!suporte") {

    let correctReaction;

    try {
      correctReaction = await react(message, '✅');
      await message.author.send("Olá! Sou a Lia,Como posso te ajudar?")
    } catch (error) {

      await removeReaction(correctReaction, client);

      await react(message, '❌');

      await logError(error, 'Erro ao responder Chamado');

      message.reply("Não consegui te enviar mensagem privada. Ative seu DM 😢");
    }

    return
  }
// ----------------------------------- //

// Caso seja mensagem privada
  if (!message.guild) {

    try {
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

      const resposta = response.choices[0].message.content;

      // Fora do escopo de mensagens
      if (resposta.toLowerCase().includes("fora_do_escopo")) {
        await logIA("Fora do Escopo",
          message.content,
          message.author.tag);

        return message.reply(`Essa solicitação não está relacionada ao suporte do ERP LINVIX.

          Se precisar, posso ajudar com erros, integrações, banco de dados, APIs ou regras de negócio do sistema.`);
        }

      // Nao sabe responder
      if (resposta.toLowerCase().includes("nao_sei_responder")) {
        await logIA("Nao Sabe", message.content, message.author.tag);

        return message.reply("Ainda não sei responder isso 😅");
        }
      
      // Resposta normal
      await logIA("Resposta Normal", message.content, message.author.tag);
      await message.reply(resposta);

    } catch (error) {
      console.error(error)

      await logError(error, 'Erro ao responder DM');

      message.reply("Ocorreu um erro ao falar com a IA 😢")
    }

    return
  }
// ----------------------------------- //

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


      const resposta = response.choices[0].message.content;
      await message.reply(resposta);
      correctReaction = await react(message, '✅');

    } catch (error) {
      console.error(error)

      await removeReaction(correctReaction, client);

      await react(message, '❌');

      await logError(error, 'Erro ao responder Servidor');

      message.reply("Erro ao responder 😢")
    }

  }

})

client.login(process.env.DISCORD_TOKEN)