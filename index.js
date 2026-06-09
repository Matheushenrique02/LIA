import 'dotenv/config'
import { Client, GatewayIntentBits, Partials } from 'discord.js'
import { lidaCriacaoMensagem } from './handlers/messageHandler.js' 

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
})

client.once('ready', (c) => {
  console.log(`✅ Lia está online como: ${c.user.tag}`)
})

// 3. Conecta o handler de mensagens

client.on('messageCreate', lidaCriacaoMensagem)

// 4. Login com tratamento de erro
client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error('❌ [DISCORD_LOGIN_ERROR]', error)
  process.exit(1)
})