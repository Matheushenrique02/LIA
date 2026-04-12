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
    GatewayIntentBits.MessageContent
  ]
})

client.on('clientReady', () => {
  console.log('Lia está online!')
})

client.on('messageCreate', async (message) => {
  if(message.author.bot) return

  try {

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é a Lia, uma assistente amigável de Discord que ajuda os usuários."
        },
        {
          role: "user",
          content: message.content
        }
      ]
    });

    message.reply(response.choices[0].message.content);

  } catch (error) {
    console.error(error)
    message.reply("Ocorreu um erro ao falar com a IA 😢")
  }

})

client.login(process.env.DISCORD_TOKEN)