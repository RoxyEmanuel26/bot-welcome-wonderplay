import { Message, Client, Collection } from 'discord.js';
import gameManager from '../games/GameManager.js';

// Custom Interface to temporarily handle custom properties on Client
interface CustomClient extends Client {
    commands: Collection<string, any>;
}

export default {
    name: 'messageCreate',
    once: false,
    async execute(message: Message, client: CustomClient) {
        if (message.author.bot) return;

        // --- 1. GAME MESSAGE HANDLER ---
        // Cek apakah pesan di dalam thread game (O(1) lookup)
        if (message.channel.isThread()) {
            const game = gameManager.getGameByThread(message.channel.id);
            if (game && game.status === 'playing') {
                await game.validateAnswer(message);
                return;
            }
        }

        // --- 2. LOBBY JOIN HANDLER ---
        // User join lobby via reply (O(1) lookup)
        if (message.reference && message.reference.messageId && message.member) {
            const game = gameManager.getGameByLobby(message.reference.messageId);
            if (game && game.status === 'lobby') {
                const joined = (game as any).addPlayer(message.member);
                if (joined) {
                    message.react('✅').catch(() => { });
                } else {
                    message.react('❌').catch(() => { });
                }
                return;
            }
        }

        // --- 3. PREFIX COMMAND HANDLER ---
        const prefixes = ['!', '?'];
        const usedPrefix = prefixes.find(p => message.content.startsWith(p));
        if (!usedPrefix) return;

        const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();

        if (!commandName) return;

        const command = client.commands?.get(commandName);

        if (!command) return;

        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(`❌ Error executing ${usedPrefix}${commandName}:`, error);
            await message.reply('❌ Ada error saat execute command!');
        }
    }
};
