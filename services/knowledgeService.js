// CORREÇÃO: Importa o JSON direto, já que você não tem o ticketSource.js
import tickets from '../tickets_lia.json' assert { type: 'json' };

export async function gatherKnowledge(query, options = {}) {
    try {
        const p = query.toLowerCase();
        // Busca simples dentro do JSON
        const resultados = tickets.filter(t => 
            t.pergunta?.toLowerCase().includes(p) || 
            t.descricao?.toLowerCase().includes(p) ||
            t.resolucao?.toLowerCase().includes(p)
        );

        return resultados.slice(0, options.limit ?? 5);
    } catch (error) {
        console.error('❌ [KNOWLEDGE_SERVICE_ERROR]:', error);
        return [];
    }
}

export function buildKnowledgeContext(items) {
    if (!items || items.length === 0) return 'Nenhuma informação técnica encontrada.';

    return items.map((item, index) => {
        return `TICKET ${index + 1}:\nPergunta: ${item.pergunta}\nSolução: ${item.resolucao}`;
    }).join('\n\n');
}