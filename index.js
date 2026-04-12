require('dotenv').config()

const { Client, GatewayIntentBits } = require('discord.js')

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

client.on('ready', () => {
  console.log('Lia está online!')
})

client.on('messageCreate', message => {
  if(message.author.bot) return

  if(message.content.toLowerCase().includes('lia')){
    message.reply('Oi Sou a Lia , Suporte N2')
  }
})

client.login(process.env.DISCORD_TOKEN)
