import { askAI } from './aiService.js';
import { gatherKnowledge, buildKnowledgeContext } from './knowledgeService.js';
import { supportPrompt } from '../constants.js'; 

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

        // 3. MONTAGEM DA MENSAGEM (Com histórico para continuidade)
        const messages = [
            {
                role: 'system',
                content: supportPrompt // A personalidade e regras da LIA
            },
            {
                role: 'system',
                content: `BASE DE CONHECIMENTO ATUALIZADA:\n${knowledgeContext}`
            },
            // Injeta as conversas anteriores para ela não esquecer o contexto
            ...history, 
            {
                role: 'user',
                content: userMessage // A nova pergunta
            }
        ];

        // 4. Chamada da IA
        const response = await askAI(messages, {
            temperature: options.temperature ?? 0.2,
            model: options.model ?? 'gpt-4o-mini'    
        });

        return response;

    } catch (error) {
        console.error('❌ [SUPPORT_SERVICE_ERROR]:', error);
        throw error; 
    }
}