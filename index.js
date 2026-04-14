require('dotenv').config()

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

  
  if (message.content === "!suporte") {

    try {
      await message.author.send("Olá! Sou a Lia,Como posso te ajudar?")
    } catch (error) {
      message.reply("Não consegui te enviar mensagem privada. Ative seu DM 😢")
    }

    return
  }

  
  if (!message.guild) {

    try {

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Você é a Lia, uma assistente de suporte profissional no Discord.
Você ajuda usuários com dúvidas, suporte técnico e atendimento.
Seja educada, clara e objetiva.
            `
          },
          {
            role: "user",
            content: message.content
          }
        ]
      });

      await message.reply(response.choices[0].message.content);

    } catch (error) {
      console.error(error)
      message.reply("Ocorreu um erro ao falar com a IA 😢")
    }

    return
  }

  
  if (message.mentions.has(client.user)) {

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

      await message.reply(response.choices[0].message.content);

    } catch (error) {
      console.error(error)
      message.reply("Erro ao responder 😢")
    }

  }

})

client.login(process.env.DISCORD_TOKEN)