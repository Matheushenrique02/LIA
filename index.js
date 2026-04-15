require('dotenv').config()

const tickets = require('./arquivos/tickets_lia.json')

const PromptPadrao = `
Você é a Lia, assistente técnica especialista no ERP LINVIX.

Sua função é auxiliar técnicos com suporte avançado, diagnóstico de problemas e resolução eficiente.

Diretrizes principais:
- Seja técnica, objetiva e estruturada
- Vá direto ao ponto, evitando explicações desnecessárias
- Priorize diagnóstico e solução
- Sempre que possível, identifique a causa raiz do problema
- Utilize linguagem técnica adequada (ERP, banco de dados, APIs, integrações, regras de negócio)

Estrutura das respostas:
1. Análise do problema
2. Possíveis causas
3. Solução recomendada

Comportamento adaptativo:
- Se a dúvida for simples ou mal formulada, esclareça e organize antes de responder
- Se faltar contexto, peça informações objetivas antes de concluir
- Evite assumir informações sem evidência
- Se houver múltiplas soluções, apresente a mais provável primeiro

Boas práticas:
- Seja clara e organizada
- Evite respostas genéricas
- Evite repetir a pergunta
- Sempre que útil, sugira validações (logs, testes, queries, etc.)

Contexto:
- Sistema ERP LINVIX
- Cenários incluem: erros, integrações, banco de dados, API, autenticação, processos internos e regras de negócio

Objetivo:
Resolver problemas com eficiência e precisão técnica, como um analista de suporte experiente.

Evite:
- Linguagem leiga
- Explicações óbvias
- Respostas vagas ou superficiais
`

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


// Função utilizada para buscar ticket
function buscarTicket(pergunta) {
  const perguntaLower = pergunta.toLowerCase()

  return tickets.find(ticket =>
    ticket.descricao?.toLowerCase().includes(perguntaLower) ||
    ticket.detalhamento?.toLowerCase().includes(perguntaLower)
  )
}


client.on('clientReady', () => {
  console.log('Lia está online!')
})


client.on('messageCreate', async (message) => {

  if (message.author.bot) return

  // Comando pra acionar suporte
  if (message.content === "!suporte") {

    try {
      await message.react('✅')
      await message.author.send("Olá! Sou a Lia 🤖 Como posso te ajudar?")
    } catch (error) {
      message.reply("Não consegui te enviar mensagem privada. Ative seu DM 😢")
    }

    return
  }

  // Mensagem privada
  if (!message.guild) {

    try {

      await message.react('⏳')

      const ticketEncontrado = buscarTicket(message.content)

      const contextoTicket = ticketEncontrado
        ? `
Ticket semelhante encontrado:
Descrição: ${ticketEncontrado.descricao}
Detalhamento: ${ticketEncontrado.detalhamento}
Resolução: ${ticketEncontrado.resolucao}
`
        : "Nenhum ticket semelhante encontrado."

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: PromptPadrao
          },
          {
            role: "system",
            content: contextoTicket
          },
          {
            role: "user",
            content: message.content
          }
        ]
      });

      await message.react('✅')
      await message.reply(response.choices[0].message.content);

    } catch (error) {
      console.error(error)
      await message.react('❌')
      message.reply("Ocorreu um erro ao falar com a IA 😢")
    }

    return
  }


  // Responder quando mencionar no servidor
  if (message.mentions.has(client.user)) {

    try {

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é a Lia, assistente técnica do ERP LINVIX."
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