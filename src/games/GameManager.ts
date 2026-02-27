import { Guild, TextChannel, User, GuildMember } from 'discord.js';
import SambungKataGame from './SambungKataGame.js';

export interface RematchData {
    hostId: string;
    level: number;
    playerIds: string[];
    guildId: string;
    channelId: string;
    threadId: string;
}

class GameManager {
    public activeGames: Map<string, SambungKataGame>;
    public rematchData: Map<string, RematchData>; // key: message ID
    public threadGames: Map<string, SambungKataGame>; // key: thread ID → fast lookup
    public lobbyGames: Map<string, SambungKataGame>; // key: lobbyMessageId → game

    constructor() {
        this.activeGames = new Map(); // key: guildId_channelId
        this.rematchData = new Map();
        this.threadGames = new Map();
        this.lobbyGames = new Map();
    }

    registerLobby(messageId: string, game: SambungKataGame): void {
        this.lobbyGames.set(messageId, game);
    }

    unregisterLobby(messageId: string): void {
        this.lobbyGames.delete(messageId);
    }

    getGameByLobby(messageId: string): SambungKataGame | null {
        return this.lobbyGames.get(messageId) || null;
    }

    registerThread(threadId: string, game: SambungKataGame): void {
        this.threadGames.set(threadId, game);
    }

    unregisterThread(threadId: string): void {
        this.threadGames.delete(threadId);
    }

    getGameByThread(threadId: string): SambungKataGame | null {
        return this.threadGames.get(threadId) || null;
    }

    storeRematchData(messageId: string, data: RematchData): void {
        this.rematchData.set(messageId, data);
        // Auto-expire after 15 seconds (5s buffer over 10s button disable)
        setTimeout(() => {
            this.rematchData.delete(messageId);
        }, 15000);
    }

    getRematchData(messageId: string): RematchData | undefined {
        return this.rematchData.get(messageId);
    }

    createGame(guild: Guild, channel: TextChannel, host: GuildMember, level: number): SambungKataGame | null {
        const key = `${guild.id}_${channel.id}`;

        if (this.activeGames.has(key)) {
            return null; // Game already in progress in this channel
        }

        const game = new SambungKataGame(guild.id, channel.id, host, level);
        this.activeGames.set(key, game);
        return game;
    }

    getGame(guildId: string, channelId: string): SambungKataGame | null {
        return this.activeGames.get(`${guildId}_${channelId}`) || null;
    }

    endGame(guildId: string, channelId: string): void {
        const key = `${guildId}_${channelId}`;
        this.activeGames.delete(key);
    }

    isUserInGame(userId: string, guildId: string): boolean {
        for (const game of this.activeGames.values()) {
            if (game.guildId === guildId && (game as any).players.has(userId)) {
                return true;
            }
        }
        return false;
    }

    getActiveGameCount(): number {
        return this.activeGames.size;
    }

    async shutdownAllGames(): Promise<void> {
        let count = 0;
        for (const [key, game] of this.activeGames.entries()) {
            if (game.status === 'playing' || game.status === 'lobby') {
                try {
                    const channelOrThread = (game as any).thread || (game as any).lobbyMessage?.channel;
                    if (channelOrThread && 'send' in channelOrThread) {
                        await channelOrThread.send('⚠️ **PERMAINAN DIBATALKAN**\nBot sedang melakukan *maintenance* atau *restart* mendadak. Mohon maaf atas ketidaknyamanan ini! 🙏');
                    }
                    game.endGame();
                    count++;
                } catch (e) {
                    console.error(`Gagal mematikan game ${key}:`, e);
                }
            }
        }
        console.log(`✅ Graceful shutdown completed: ${count} games cleaned up.`);
    }
}

const gameManager = new GameManager();

export default gameManager;
