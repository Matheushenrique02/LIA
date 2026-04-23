require('dotenv').config()

// ================================
// IMPORTS
// ================================

const { PromptPadrao } = require('./constants');
const { logError, logIA } = require('./logger');
const tickets = require('./tickets_lia.json');

const OpenAI = require("openai");

const { Client, GatewayIntentBits, Partials } = require('discord.js')


// ================================
// CONFIG
// ================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User
  ]
})


// ================================
// BUSCA INTELIGENTE DE TICKETS
// ================================

function buscarTickets(pergunta, tickets) {

  const perguntaLower = pergunta.toLowerCase()

  const palavras = perguntaLower
    .split(/\W+/)
    .filter(p => p.length > 2)

  const resultados = tickets.map(ticket => {

    const texto = (
      ticket.descricao +
      " " +
      ticket.detalhamento +
      " " +
      ticket.resolucao
    ).toLowerCase()

    let score = 0

    // match exato (muito forte)
    if (texto.includes(perguntaLower)) score += 10

    // match por palavras
    palavras.forEach(p => {
      if (texto.includes(p)) score += 2
    })

    return { ticket, score }

  })

  let filtrados = resultados
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(r => r.ticket)

  // fallback: evita IA sem contexto
  if (filtrados.length === 0) {
    filtrados = tickets.slice(0, 3)
  }

  return filtrados
}


// ================================
// GERAR CONTEXTO
// ================================

function gerarContextoTickets(ticketsRelevantes) {
  return ticketsRelevantes
    .map(t => `
[CASO REAL DE SUPORTE]

Problema: ${t.detalhamento}
Causa: ${t.descricao}
Solução aplicada: ${t.resolucao}
`)
    .join("\n")
}


// ================================
// GERAR PROMPT
// ================================

function montarMensagens(pergunta, contextoTickets) {
  return [
    {
      role: "system",
      content: PromptPadrao
    },
    {
      role: "system",
      content: `
Você é a LIA, assistente técnica.

REGRAS IMPORTANTES:

1. SEMPRE tente responder usando os tickets abaixo
2. Se encontrar algo parecido, USE a solução do ticket
3. NÃO ignore os tickets
4. Só use conhecimento geral se NÃO houver informação relevante

TICKETS DISPONÍVEIS:

${contextoTickets}
`
    },
    {
      role: "user",
      content: pergunta
    }
  ]
}


// ================================
// PROCESSAR RESPOSTA IA
// ================================

async function responderIA(pergunta, userTag) {

  const ticketsRelevantes = buscarTickets(pergunta, tickets)

  console.log("Pergunta:", pergunta)
  console.log("Tickets usados:", ticketsRelevantes.map(t => t.descricao))

  const contextoTickets = gerarContextoTickets(ticketsRelevantes)

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: montarMensagens(pergunta, contextoTickets)
  });

  const resposta = response.choices[0].message.content.trim()

  // Fora do escopo
  if (resposta === "FORA_DO_ESCOPO") {
    await logIA("Fora do Escopo", pergunta, userTag)
    return "Essa solicitação não está relacionada a suporte técnico."
  }

  // Não sabe responder
  if (resposta === "NAO_SEI_RESPONDER") {
    await logIA("Nao Sabe", pergunta, userTag)
    return "Ainda não tenho informação suficiente para responder isso."
  }

  await logIA("Resposta Normal", pergunta, userTag)

  return resposta
}


// ================================
// BOT ONLINE
// ================================

client.on('clientReady', () => {
  console.log('Lia está online!')
})


// ================================
// EVENTO DE MENSAGEM
// ================================

client.on('messageCreate', async (message) => {

  if (message.author.bot) return

// ================================
// COMANDO SUPORTE
// ================================

  if (message.content === "!suporte") {

    try {
      await message.author.send(
        "Olá! Sou a Lia, SuporteN2. Como posso ajudar?"
      )
    } catch (error) {
      await logError(error, 'Erro ao abrir DM')
      message.reply("Não consegui te enviar mensagem privada 😢")
    }

    return
  }


// ================================
// MENSAGEM PRIVADA
// ================================

  if (!message.guild) {

    try {

      const resposta = await responderIA(
        message.content,
        message.author.tag
      )

      await message.reply(resposta)

    } catch (error) {

      console.error(error)
      await logError(error, 'Erro responder DM')

      message.reply("Erro ao falar com a IA 😢")
    }

    return
  }


// ================================
// MENÇÃO NO SERVIDOR
// ================================

  if (message.mentions.has(client.user)) {

    try {

      const resposta = await responderIA(
        message.content,
        message.author.tag
      )

      await message.reply(resposta)

    } catch (error) {

      console.error(error)
      await logError(error, 'Erro responder servidor')

      message.reply("Erro ao responder 😢")
    }

  }

})


// ================================
// LOGIN
// ================================

client.login(process.env.DISCORD_TOKEN)