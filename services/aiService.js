import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

/**
 * Envia uma lista de mensagens para a IA.
 * @param {Array} messages - Array no formato [{role: 'user', content: '...'}]
 * @param {Object} options - Configurações extras (modelo, temperatura)
 */
export async function askAI(messages, options = {}) {
    try {
        // Verificação de segurança
        if (!process.env.OPENAI_KEY) {
            throw new Error('OPENAI_KEY não configurada no arquivo .env');
        }

        const response = await openai.chat.completions.create({
            model: options.model || 'gpt-4o-mini',
            temperature: options.temperature ?? 0.3, // 0.3 mantém a Lia objetiva e técnica
            messages
        });

        const content = response?.choices?.[0]?.message?.content?.trim();

        if (!content) {
            throw new Error('A IA retornou uma resposta vazia.');
        }

        return content;

    } catch (error) {
        console.error('❌ [AI_SERVICE_ERROR]:', {
            message: error.message,
            status: error.status,
            code: error.code
        });

        // Repassamos o erro para o handler tratar
        throw error; 
    }
}

export default { askAI };