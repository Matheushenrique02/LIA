import { askAI } from './aiService.js';
import { gatherKnowledge, buildKnowledgeContext } from './knowledgeService.js';
import { supportPrompt } from '../constants.js'; 

export async function answerSupportQuestion(userMessage, history = [], options = {}) {
    // ... resto do código igual ao que mandei antes ...
}

/**
 * Processa a dúvida do usuário, integrando Base de Conhecimento e Histórico.
 * @param {string} userMessage - Mensagem atual do usuário.
 * @param {Array} history - Array de mensagens anteriores [{role, content}].
 */
export async function answerSupportQuestion(userMessage, history = [], options = {}) {
    // 1. Validação de entrada
    if (!userMessage || !userMessage.trim()) {
        return 'Por favor, descreva o problema para que eu possa te ajudar.';
    }

    try {
        // 2. Busca conhecimento (Tickets) baseado na pergunta atual
        const knowledgeItems = await gatherKnowledge(userMessage, {
            limit: options.knowledgeLimit ?? 8,
            ticketLimit: options.ticketLimit ?? 5
        });

        const knowledgeContext = buildKnowledgeContext(knowledgeItems);

        // 3. MONTAGEM DA MEMÓRIA (Ajuste Crítico para continuidade)
        const messages = [
            {
                role: 'system',
                content: supportPrompt // A personalidade da LIA
            },
            {
                role: 'system',
                content: `BASE DE CONHECIMENTO DISPONÍVEL:\n${knowledgeContext}`
            },
            // Aqui espalhamos o histórico da conversa (Memória)
            // Isso faz com que a IA saiba o que foi perguntado antes.
            ...history, 
            {
                role: 'user',
                content: userMessage // A dúvida atual
            }
        ];

        // 4. Chamada da IA com temperatura baixa para evitar "alucinações"
        const response = await askAI(messages, {
            temperature: options.temperature ?? 0.2,
            model: options.model ?? 'gpt-4o-mini'    
        });

        return response;

    } catch (error) {
        console.error('❌ [SUPPORT_SERVICE_ERROR]:', error);
        throw error; // Repassa para o Handler lidar com a mensagem de erro no Discord
    }
}