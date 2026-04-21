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

const { Client, GatewayIntentBits, Partials } = require('discord.js')

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

  const palavras = pergunta
    .toLowerCase()
    .split(" ")
    .filter(p => p.length > 2)

  const resultados = tickets.map(ticket => {

    const texto = (
      ticket.descricao +
      ticket.detalhamento +
      ticket.resolucao
    ).toLowerCase()

    let score = 0

    // Score por palavras da pergunta
    palavras.forEach(palavra => {
      if (texto.includes(palavra)) score += 2
    })

    // Priorizar termos técnicos
    if (texto.includes("erro")) score += 1
    if (texto.includes("serviço")) score += 1
    if (texto.includes("network")) score += 1
    if (texto.includes("pdv")) score += 1
    if (texto.includes("sistema")) score += 1

    // Penalizar tickets genéricos
    const genericos = [
      "ajustado",
      "auxiliado",
      "auxiliei",
      "cliente orientado",
      "suporte realizado",
      "verificado",
      "confirmado"
    ]

    genericos.forEach(p => {
      if (texto.includes(p)) score -= 1
    })

    return {
      ticket,
      score
    }

  })

  return resultados
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(r => r.ticket)
}


// ================================
// BOT ONLINE
// ================================

client.on('clientReady', () => {
  console.log('Lia está online!')
})


// ================================
// MENSAGENS
// ================================

client.on('messageCreate', async (message) => {

  if (message.author.bot) return

// ================================
// COMANDO SUPORTE
// ================================

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


// ================================
// MENSAGEM PRIVADA (CORRIGIDO)
// ================================

  if (!message.guild) {

    try {

      const ticketsRelevantes = buscarTickets(
        message.content,
        tickets
      )

      const contextoTickets = ticketsRelevantes
        .map(t => `
Ticket Resolvido:

Título: ${t.descricao}
Problema: ${t.detalhamento}
Solução: ${t.resolucao}
`)
        .join("\n")

      console.log("Tickets encontrados:", ticketsRelevantes.length)

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

${contextoTickets}

Use esses tickets como prioridade.
Se não encontrar resposta, utilize conhecimento geral.
`
          },
          {
            role: "user",
            content: message.content
          }
        ]
      });

      const resposta = response.choices[0].message.content.trim()


// ================================
// FORA DO ESCOPO
// ================================

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


// ================================
// NAO SABE RESPONDER
// ================================

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


// ================================
// RESPOSTA NORMAL
// ================================

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


// ================================
// QUANDO MENCIONAR NO SERVIDOR
// ================================

  if (message.mentions.has(client.user)) {

    try {

      const ticketsRelevantes = buscarTickets(
        message.content,
        tickets
      )

      const contextoTickets = ticketsRelevantes
        .map(t => `
Ticket Resolvido:

Título: ${t.descricao}
Problema: ${t.detalhamento}
Solução: ${t.resolucao}
`)
        .join("\n")

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

${contextoTickets}

Use esses tickets como prioridade.
Se não encontrar resposta, utilize conhecimento geral.
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