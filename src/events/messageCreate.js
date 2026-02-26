import gameManager from '../games/GameManager.js';

export default {
    name: 'messageCreate',
    once: false,
    async execute(message, client) {
        if (message.author.bot) return;

        // --- 1. GAME MESSAGE HANDLER ---
        // Cek apakah pesan di dalam thread game
        if (message.channel.isThread()) {
            for (const game of gameManager.activeGames.values()) {
                if (game.thread && game.thread.id === message.channel.id) {
                    if (game.status === 'playing') {
                        await game.validateAnswer(message);
                    }
                    return; // Stop event flow here if it's a game thread messages
                }
            }
        }

        // --- 2. LOBBY JOIN HANDLER ---
        // User join lobby via reply
        if (message.reference && message.reference.messageId) {
            for (const game of gameManager.activeGames.values()) {
                if (game.status === 'lobby' && game.lobbyMessage && game.lobbyMessage.id === message.reference.messageId) {
                    const joined = game.addPlayer(message.member);
                    if (joined) {
                        message.react('✅').catch(() => { });
                    } else {
                        message.react('❌').catch(() => { });
                    }
                    return;
                }
            }
        }

        // --- 3. PREFIX COMMAND HANDLER ---
        const prefixes = ['!', '?'];
        const usedPrefix = prefixes.find(p => message.content.startsWith(p));
        if (!usedPrefix) return;

        const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);

        if (!command) return;

        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(`❌ Error executing ${usedPrefix}${commandName}:`, error);
            await message.reply('❌ Ada error saat execute command!');
        }
    }
};
