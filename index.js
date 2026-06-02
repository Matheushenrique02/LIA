require('dotenv').config()

const express = require('express')

const app = express()

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('LIA ONLINE')
})

app.listen(PORT, () => {
  console.log(`Servidor web iniciado na porta ${PORT}`)
})

// IMPORTS

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
    const perguntaLower = pergunta.toLowerCase();
    
    // Lista de palavras irrelevantes para ignorar na busca
    const stopwords = ['estou', 'com', 'um', 'erro', 'no', 'sistema', 'na', 'do', 'da', 'como', 'fazer'];
    const palavrasChave = perguntaLower
        .split(/\W+/)
        .filter(p => p.length > 2 && !stopwords.includes(p));

    const resultados = tickets.map(ticket => {
        const descricao = (ticket.descricao || "").toLowerCase();
        const detalhamento = (ticket.detalhamento || "").toLowerCase();
        const resolucao = (ticket.resolucao || "").toLowerCase();
        const textoCompleto = `${descricao} ${detalhamento} ${resolucao}`;

        let score = 0;

        // 1. Match exato de termos técnicos (ex: "NCM", "NF-E", "CERTIFICADO")
        palavrasChave.forEach(palavra => {
            if (textoCompleto.includes(palavra)) {
                score += 5; // Aumenta o peso para palavras-chave encontradas
            }
        });

        // 2. Bonus se o título (descrição) contiver a palavra principal
        if (palavrasChave.some(p => descricao.includes(p))) {
            score += 10;
        }

        // 3. Match de frases completas gera pontuação máxima
        if (detalhamento.includes(perguntaLower)) {
            score += 50;
        }

        return { ticket, score };
    });

    // Ordena por relevância e filtra apenas os que tem score > 0
    let filtrados = resultados
        .filter(r => r.score > 5) // Exige um mínimo de compatibilidade
        .sort((a, b) => b.score - a.score)
        .slice(0, 3) // Pega os 3 melhores
        .map(r => r.ticket);

    return filtrados;
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