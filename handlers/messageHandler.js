import { answerSupportQuestion } from "../services/supportService.js";
import {
    sendLoading,
    removeReaction,
    safeReply,
    sendError
} from "../services/discordService.js";

// Mapa simples para guardar o histórico das conversas (Memória)
const historicoConversas = new Map();

export async function lidaCriacaoMensagem(message) {
    // 1. Filtro básico: Ignora bots
    if (message.author.bot) return;

    // 2. Definições de contexto (Correção: .guild é com 'g' minúsculo)
    const isDM = !message.guild;
    const mencaoBot = message.mentions.has(message.client.user);
    const userId = message.author.id;

    // 3. Comando !suporte
    if (message.content.trim() === '!suporte') {
        try {
            await message.react('✅');
            await message.author.send('Olá! Sou a Lia. Como posso te ajudar?');
            return; // Importante: para a execução aqui para não responder duas vezes
        } catch (error) {
            await safeReply(message, 'Não consegui te enviar mensagem privada. Verifique suas configurações de DM.');
            return;
        }
    }

    // 4. Critério de Resposta: Só responde se for DM ou se for mencionado no servidor
    if (!isDM && !mencaoBot) return;

    // 5. Limpeza do texto (Remover a menção do bot da frase)
    let textoLimpo = message.content.trim();
    if (!isDM) {
        textoLimpo = textoLimpo.replace(/<@!?\d+>/g, '').trim();
    }

    // Se a mensagem estiver vazia (só marcou o bot), pede uma descrição
    if (!textoLimpo) {
        if (mencaoBot) await safeReply(message, 'Oi! Descreva o problema para eu poder te auxiliar.');
        return;
    }

    let carregandoReacao;

    try {
        // Mostra que está "pensando"
        carregandoReacao = await sendLoading(message);

        // --- LÓGICA DE MEMÓRIA ---
        // Pegamos o histórico atual ou criamos um novo
        const historico = historicoConversas.get(userId) || [];

        // Chamamos a IA passando o texto atual E o histórico do usuário
        const resposta = await answerSupportQuestion(textoLimpo, historico);

        // Remove a reação de carregamento
        if (carregandoReacao) await removeReaction(carregandoReacao);

        // 6. Tratamento de Respostas Especiais
        if (resposta === 'FORA_DO_ESCOPO') {
            await safeReply(message, 'Posso ajudar apenas com dúvidas relacionadas a suporte técnico do Sistema Linvix e tecnologia.');
            return;
        }

        if (resposta === 'NAO_SEI_RESPONDER') {
            await safeReply(message, 'Não tenho informações suficientes para te ajudar com essa dúvida no momento.');
            return;
        }

        // 7. Envia a resposta final
        await safeReply(message, resposta);

        // 8. ATUALIZA A MEMÓRIA (Salva a pergunta e a resposta para a próxima vez)
        historico.push({ role: "user", content: textoLimpo });
        historico.push({ role: "assistant", content: resposta });

        // Mantém apenas as últimas 10 mensagens para não ficar lento/caro
        if (historico.length > 10) historico.splice(0, 2);
        historicoConversas.set(userId, historico);

    } catch (error) {
        console.error('[MESSAGE_HANDLER_ERROR]', error);
        if (carregandoReacao) await removeReaction(carregandoReacao);
        await sendError(message, 'Ocorreu um erro ao processar sua solicitação. Tente novamente em instantes.');
    }
}