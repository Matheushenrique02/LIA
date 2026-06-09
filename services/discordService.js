
function splitMessage(text, maxLength = 1900) {
    if (text.length <= maxLength) return [text];
    
    const chunks = [];
    let current = text;
    
    while (current.length > 0) {
        chunks.push(current.substring(0, maxLength));
        current = current.substring(maxLength);
    }
    return chunks;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendLoading(message) {
    try {
        if (message.channel && typeof message.channel.sendTyping === 'function') {
            await message.channel.sendTyping();
        }
        return await message.react('⏳');
    } catch { return null; }
}

export async function removeReaction(reaction) {
    if (!reaction) return;
    try { await reaction.users.remove(reaction.client.user.id); } catch {
        try { await reaction.remove(); } catch {}
    }
}

export async function safeReply(message, text) {
    if (!text) return;

    // Usando a função que criamos aqui em cima
    const parts = splitMessage(text);

    for (const part of parts) {
        try {
            await message.reply(part);
            await delay(300);
        } catch (error) {
            console.error('[REPLY_ERROR]', error.message);
        }
    }
}

export async function sendError(message, text = 'Ocorreu um erro') {
    try {
        await message.react('❌');
        await message.reply(text);
    } catch {}
}