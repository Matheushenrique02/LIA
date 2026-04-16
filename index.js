require('dotenv').config()

// Constantes
const { PromptPadrao } = require('./constants');
const { logError, logIA } = require('./logger');
const tickets = require('./tickets_lia.json');


// OpenAI
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

// Comando suporte

  if (message.content === "!suporte") {

    try {

      await message.author.send(
        "Olá! Sou a Lia, assistente técnica.\nComo posso te ajudar?"
      )

    } catch (error) {

      await logError(error, 'Erro ao abrir DM');

      message.reply(
        "Não consegui te enviar mensagem privada. Ative seu DM 😢"
      )

    }

    return
  }

// Mensagem privada

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
            role: "system",
            content: `
Base de conhecimento interna (tickets resolvidos):

${JSON.stringify(tickets).slice(0, 12000)}

Use essa base para responder quando possível.
Se encontrar algo parecido, utilize a solução existente.
`
          },
          {
            role: "user",
            content: message.content
          }
        ]
      });

      const resposta = response.choices[0].message.content.trim()

// Fora do escopo

      if (resposta === "FORA_DO_ESCOPO") {

        await logIA(
          "Fora do Escopo",
          message.content,
          message.author.tag
        )

        return message.reply(
          "Essa solicitação não está relacionada a suporte técnico. Posso ajudar com sistemas, impressoras, rede, integrações e erros técnicos."
        )
      }

// Não sabe responder

      if (resposta === "NAO_SEI_RESPONDER") {

        await logIA(
          "Nao Sabe",
          message.content,
          message.author.tag
        )

        return message.reply(
          "Ainda não tenho informação suficiente para responder isso. Vou registrar para melhoria."
        )
      }

// Resposta normal

      await logIA(
        "Resposta Normal",
        message.content,
        message.author.tag
      )

      await message.reply(resposta)

    } catch (error) {

      console.error(error)

      await logError(error, 'Erro responder DM');

      message.reply(
        "Ocorreu um erro ao falar com a IA 😢"
      )
    }

    return
  }

// Quando mencionar no servidor

  if (message.mentions.has(client.user)) {

    try {

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: PromptPadrao
          },
          {
            role: "system",
            content: `
Base de conhecimento interna:

${JSON.stringify(tickets).slice(0, 12000)}
`
          },
          {
            role: "user",
            content: message.content
          }
        ]
      });

      const resposta = response.choices[0].message.content

      await message.reply(resposta)

    } catch (error) {

      console.error(error)

      await logError(error, 'Erro responder servidor');

      message.reply("Erro ao responder 😢")
    }

  }

})


client.login(process.env.DISCORD_TOKEN)